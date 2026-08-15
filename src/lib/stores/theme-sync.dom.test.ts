import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The cross-tab/OS-preference listeners are registered once, when
// theme.svelte.ts is first imported — so each test that needs a specific
// matchMedia/storage mock in place at that moment re-imports the module
// fresh via vi.resetModules().

let changeHandler: ((e: { matches: boolean }) => void) | undefined;

function mockMatchMedia(initialMatches: boolean) {
  changeHandler = undefined;
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: initialMatches,
    addEventListener: (
      _event: string,
      cb: (e: { matches: boolean }) => void,
    ) => {
      changeHandler = cb;
    },
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

async function freshThemeModule() {
  vi.resetModules();
  return import("./theme");
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("theme store system-preference sync", () => {
  it("switches to dark on an OS change when no theme is stored", async () => {
    mockMatchMedia(false);
    const { themeState } = await freshThemeModule();

    changeHandler?.({ matches: true });

    expect(themeState.value).toBe("dark");
  });

  it("switches to light on an OS change when no theme is stored", async () => {
    mockMatchMedia(true);
    const { themeState } = await freshThemeModule();

    changeHandler?.({ matches: false });

    expect(themeState.value).toBe("light");
  });

  it("ignores OS changes when a theme is explicitly stored", async () => {
    localStorage.setItem("theme", "light");
    mockMatchMedia(false);
    const { themeState } = await freshThemeModule();

    changeHandler?.({ matches: true });

    expect(themeState.value).toBe("light");
  });
});

describe("theme store cross-tab sync", () => {
  it("adopts a theme value written by another tab", async () => {
    mockMatchMedia(false);
    const { themeState } = await freshThemeModule();

    window.dispatchEvent(
      new StorageEvent("storage", { key: "theme", newValue: "dark" }),
    );

    expect(themeState.value).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("falls back to the OS preference when the stored theme is cleared", async () => {
    mockMatchMedia(true);
    const { themeState } = await freshThemeModule();

    window.dispatchEvent(
      new StorageEvent("storage", { key: "theme", newValue: null }),
    );

    expect(themeState.value).toBe("dark");
  });

  it("ignores storage events for unrelated keys", async () => {
    mockMatchMedia(false);
    const { themeState, setTheme } = await freshThemeModule();
    setTheme("light");

    window.dispatchEvent(
      new StorageEvent("storage", { key: "not-theme", newValue: "dark" }),
    );

    expect(themeState.value).toBe("light");
  });
});
