import { afterEach, describe, expect, it, vi } from "vitest";

import { activeSection } from "./active-section.svelte";
import { theme } from "./theme.svelte";
import { toast } from "./toast.svelte";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  toast.items.length = 0;
  document.documentElement.className = "";
  localStorage.clear();
});

describe("toast", () => {
  it("adds a toast of the requested kind", () => {
    toast.success("Email sent successfully!");
    expect(toast.items).toHaveLength(1);
    expect(toast.items[0]).toMatchObject({
      kind: "success",
      message: "Email sent successfully!",
    });
  });

  it("gives each toast a distinct id so two can coexist", () => {
    const a = toast.error("first");
    const b = toast.error("second");
    expect(a).not.toBe(b);
    expect(toast.items).toHaveLength(2);
  });

  it("auto-dismisses after the timeout", () => {
    vi.useFakeTimers();
    toast.success("gone soon");
    expect(toast.items).toHaveLength(1);

    vi.advanceTimersByTime(4000);
    expect(toast.items).toHaveLength(0);
  });

  it("dismisses by id without disturbing the others", () => {
    const first = toast.success("keep me");
    const second = toast.error("drop me");

    toast.dismiss(second);

    expect(toast.items).toHaveLength(1);
    expect(toast.items[0]!.id).toBe(first);
  });

  it("ignores a dismiss for an id that is already gone", () => {
    // The auto-dismiss timer fires even after a manual dismiss; a second
    // removal must not splice out an unrelated toast.
    const id = toast.success("x");
    toast.dismiss(id);
    const other = toast.error("y");

    expect(() => toast.dismiss(id)).not.toThrow();
    expect(toast.items.map((t) => t.id)).toEqual([other]);
  });
});

describe("theme", () => {
  it("paints the DOM and persists on apply", () => {
    theme.apply("dark");

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("paint updates the DOM without writing storage", () => {
    // Used by the cross-tab listener, where localStorage is already the source
    // of the change — re-writing it would be a pointless round trip.
    theme.paint("dark");

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBeNull();
  });

  it("toggles between the two themes", () => {
    theme.apply("light");
    theme.toggle();
    expect(theme.current).toBe("dark");
    theme.toggle();
    expect(theme.current).toBe("light");
  });

  it("survives storage being unavailable", () => {
    // Safari private mode throws on setItem. The toggle must still work.
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => theme.apply("dark")).not.toThrow();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  /**
   * The two ambient listeners `listen()` wires. Both are captured by stubbing
   * matchMedia and grabbing the handler the state object registers.
   */
  function listenWith({ prefersDark = false } = {}) {
    let onMediaChange!: (e: { matches: boolean }) => void;
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: prefersDark,
        addEventListener: (
          _: string,
          fn: (e: { matches: boolean }) => void,
        ) => {
          onMediaChange = fn;
        },
        removeEventListener: vi.fn(),
      })),
    );
    const teardown = theme.listen();
    return {
      teardown,
      fireMedia: (matches: boolean) => onMediaChange({ matches }),
    };
  }

  it("follows the OS while the visitor has made no explicit choice", () => {
    const { teardown, fireMedia } = listenWith();
    localStorage.clear();

    fireMedia(true);

    expect(theme.current).toBe("dark");
    teardown();
  });

  it("ignores the OS once the visitor has chosen a theme", () => {
    // An explicit choice must stick. Following the OS over it would silently
    // undo the toggle at sunset on a machine with automatic dark mode.
    const { teardown, fireMedia } = listenWith();
    theme.apply("light");

    fireMedia(true);

    expect(theme.current).toBe("light");
    teardown();
  });

  it("adopts a theme another tab wrote", () => {
    const { teardown } = listenWith();

    window.dispatchEvent(
      new StorageEvent("storage", { key: "theme", newValue: "dark" }),
    );

    expect(theme.current).toBe("dark");
    teardown();
  });

  it("ignores storage events for unrelated keys", () => {
    const { teardown } = listenWith();
    theme.apply("light");

    window.dispatchEvent(
      new StorageEvent("storage", { key: "something-else", newValue: "dark" }),
    );

    expect(theme.current).toBe("light");
    teardown();
  });

  it("falls back to the OS preference when the key is cleared", () => {
    // `newValue` is null both when the key is removed and when storage is
    // cleared wholesale — the same rule the inline script in app.html applies.
    const { teardown } = listenWith({ prefersDark: true });
    theme.apply("light");

    window.dispatchEvent(
      new StorageEvent("storage", { key: "theme", newValue: null }),
    );

    expect(theme.current).toBe("dark");
    teardown();
  });

  it("listen() returns a teardown that detaches both listeners", () => {
    const removeMedia = vi.fn();
    // stubGlobal, not spyOn: jsdom doesn't implement matchMedia at all, so
    // there is no existing function to spy on.
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: removeMedia,
      })),
    );
    const removeWindow = vi.spyOn(window, "removeEventListener");

    theme.listen()();

    expect(removeMedia).toHaveBeenCalled();
    expect(removeWindow).toHaveBeenCalledWith("storage", expect.any(Function));
  });
});

describe("activeSection", () => {
  it("tracks the current section", () => {
    activeSection.set("Projects");
    expect(activeSection.current).toBe("Projects");
    activeSection.set("Home");
  });

  it("suppresses the scroll-spy for the duration of a nav click", () => {
    // Without this the pill stutters through every section a long smooth
    // scroll passes over.
    expect(activeSection.isNavigating()).toBe(false);
    activeSection.beginNavigation();
    expect(activeSection.isNavigating()).toBe(true);
  });

  it("releases the suppression after the fallback timeout", () => {
    // The fallback for browsers without `scrollend` (Safari). Without it a
    // missed event would freeze the pill for the rest of the session.
    vi.useFakeTimers();
    activeSection.beginNavigation();

    vi.advanceTimersByTime(1000);
    expect(activeSection.isNavigating()).toBe(false);
  });

  it("releases the suppression as soon as scrollend fires", () => {
    const teardown = activeSection.listen();
    activeSection.beginNavigation();

    window.dispatchEvent(new Event("scrollend"));
    expect(activeSection.isNavigating()).toBe(false);

    teardown();
  });

  it("stops responding to scrollend after teardown", () => {
    activeSection.listen()();
    activeSection.beginNavigation();

    window.dispatchEvent(new Event("scrollend"));
    expect(activeSection.isNavigating()).toBe(true);
  });
});
