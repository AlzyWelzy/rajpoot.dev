import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { initNav } from "./nav";
import { initReveal, initScrollToTop } from "./reveal";
import { initTheme, paint } from "./theme";
import { toast } from "./toast";

/**
 * These modules are the site's entire client runtime. They are pure
 * progressive enhancement — each finds its own markup by data attribute and
 * does nothing if that markup isn't there — so the tests here mirror that:
 * build the markup a component ships, run the initialiser, assert on the DOM.
 */

type ObserverEntry = { isIntersecting: boolean; target: Element };
type ObserverStub = {
  callback: (entries: ObserverEntry[]) => void;
  options: IntersectionObserverInit | undefined;
  observed: Element[];
  disconnect: Mock<() => void>;
};

let observers: ObserverStub[] = [];

function stubIntersectionObserver() {
  observers = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      #self: ObserverStub;
      constructor(
        callback: (entries: ObserverEntry[]) => void,
        options?: IntersectionObserverInit,
      ) {
        this.#self = {
          callback,
          options,
          observed: [],
          disconnect: vi.fn<() => void>(),
        };
        observers.push(this.#self);
      }
      observe(node: Element) {
        this.#self.observed.push(node);
      }
      disconnect() {
        this.#self.disconnect();
      }
    },
  );
}

function setMatchMedia({ reduce = false, dark = false } = {}) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("reduce") ? reduce : dark,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

beforeEach(() => {
  stubIntersectionObserver();
  setMatchMedia();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  document.body.innerHTML = "";
  document.documentElement.className = "";
  document.documentElement.removeAttribute("style");
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------

describe("theme", () => {
  const markup = `<button data-theme-toggle aria-label="Switch to dark mode"
    aria-pressed="false" title="Switch to dark mode"></button>`;

  it("toggles the class on <html> and persists the choice", () => {
    document.body.innerHTML = markup;
    initTheme();

    document.querySelector<HTMLElement>("[data-theme-toggle]")!.click();

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("toggles back", () => {
    document.body.innerHTML = markup;
    initTheme();
    const button = document.querySelector<HTMLElement>("[data-theme-toggle]")!;

    button.click();
    button.click();

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("keeps the accessible name describing what the click will do", () => {
    // The served HTML always says "Switch to dark mode" because app.html's
    // pre-paint script assumes light before it reads storage; this is what
    // corrects it for a dark-mode visitor.
    document.body.innerHTML = markup;
    document.documentElement.classList.add("dark");

    paint("dark");

    const button = document.querySelector<HTMLElement>("[data-theme-toggle]")!;
    expect(button.getAttribute("aria-label")).toBe("Switch to light mode");
    expect(button.getAttribute("title")).toBe("Switch to light mode");
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("survives storage being unavailable", () => {
    // Safari private mode throws on setItem. The toggle must still work.
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    document.body.innerHTML = markup;
    initTheme();

    expect(() =>
      document.querySelector<HTMLElement>("[data-theme-toggle]")!.click(),
    ).not.toThrow();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("adopts a theme another tab wrote", () => {
    document.body.innerHTML = markup;
    initTheme();

    dispatchEvent(
      new StorageEvent("storage", { key: "theme", newValue: "dark" }),
    );

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("ignores storage events for unrelated keys", () => {
    document.body.innerHTML = markup;
    initTheme();

    dispatchEvent(
      new StorageEvent("storage", { key: "cart", newValue: "dark" }),
    );

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("does nothing when there is no toggle in the document", () => {
    expect(() => initTheme()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------

describe("nav", () => {
  const markup = `
    <nav data-nav>
      <ul data-nav-list>
        <span data-nav-pill style="opacity: 0"></span>
        <li data-nav-item="Home" data-active="true"><a href="#home" aria-current="page">Home</a></li>
        <li data-nav-item="Projects"><a href="#projects">Projects</a></li>
      </ul>
    </nav>
    <section data-section="Home"></section>
    <section data-section="Projects"></section>`;

  it("moves the active state when a section scrolls into the header band", () => {
    document.body.innerHTML = markup;
    initNav();

    const projects = document.querySelector<HTMLElement>(
      '[data-section="Projects"]',
    )!;
    observers[0]!.callback([{ isIntersecting: true, target: projects }]);

    const item = document.querySelector<HTMLElement>(
      '[data-nav-item="Projects"]',
    )!;
    expect(item.dataset.active).toBe("true");
    expect(item.querySelector("a")!.getAttribute("aria-current")).toBe("page");
  });

  it("clears the previous item's active state", () => {
    document.body.innerHTML = markup;
    initNav();

    const projects = document.querySelector<HTMLElement>(
      '[data-section="Projects"]',
    )!;
    observers[0]!.callback([{ isIntersecting: true, target: projects }]);

    const home = document.querySelector<HTMLElement>('[data-nav-item="Home"]')!;
    expect(home.dataset.active).toBeUndefined();
    expect(home.querySelector("a")!.hasAttribute("aria-current")).toBe(false);
  });

  it("suppresses the spy while a nav click's smooth scroll is in flight", () => {
    // Without this the pill stutters through every section the scroll crosses.
    vi.useFakeTimers();
    document.body.innerHTML = markup;
    initNav();

    document
      .querySelector<HTMLElement>('[data-nav-item="Projects"] a')!
      .click();

    const home = document.querySelector<HTMLElement>('[data-section="Home"]')!;
    observers[0]!.callback([{ isIntersecting: true, target: home }]);

    expect(
      document.querySelector<HTMLElement>('[data-nav-item="Projects"]')!.dataset
        .active,
    ).toBe("true");
  });

  it("resumes the spy once the scroll settles", () => {
    document.body.innerHTML = markup;
    initNav();
    document
      .querySelector<HTMLElement>('[data-nav-item="Projects"] a')!
      .click();

    dispatchEvent(new Event("scrollend"));

    const home = document.querySelector<HTMLElement>('[data-section="Home"]')!;
    observers[0]!.callback([{ isIntersecting: true, target: home }]);

    expect(
      document.querySelector<HTMLElement>('[data-nav-item="Home"]')!.dataset
        .active,
    ).toBe("true");
  });

  it("resumes via the timeout for browsers without scrollend", () => {
    // Safari. Without the fallback a missed event freezes the pill for the
    // rest of the session.
    vi.useFakeTimers();
    document.body.innerHTML = markup;
    initNav();
    document
      .querySelector<HTMLElement>('[data-nav-item="Projects"] a')!
      .click();

    vi.advanceTimersByTime(1000);

    const home = document.querySelector<HTMLElement>('[data-section="Home"]')!;
    observers[0]!.callback([{ isIntersecting: true, target: home }]);
    expect(
      document.querySelector<HTMLElement>('[data-nav-item="Home"]')!.dataset
        .active,
    ).toBe("true");
  });

  it("observes with the header-band geometry", () => {
    // The negative top margin shrinks the viewport to roughly the fixed
    // header's line; the large negative bottom keeps one section active at a
    // time. threshold 0 lets tall sections register at all.
    document.body.innerHTML = markup;
    initNav();

    expect(observers[0]!.options).toMatchObject({
      rootMargin: "-25% 0px -55% 0px",
      threshold: 0,
    });
  });

  it("makes the pill visible once it has something to measure", () => {
    document.body.innerHTML = markup;
    initNav();

    const pill = document.querySelector<HTMLElement>("[data-nav-pill]")!;
    expect(pill.style.opacity).toBe("1");
    expect(pill.style.transform).toContain("translate3d");
  });

  it("hides the pill when no item is active", () => {
    document.body.innerHTML = markup.replace(' data-active="true"', "");
    initNav();

    expect(
      document.querySelector<HTMLElement>("[data-nav-pill]")!.style.opacity,
    ).toBe("0");
  });

  it("does nothing without nav markup", () => {
    expect(() => initNav()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------

describe("reveal", () => {
  const markup = `<div data-reveal></div>`;

  it("hides the element only once it can also un-hide it", () => {
    document.body.innerHTML = markup;
    initReveal();

    expect(
      document
        .querySelector("[data-reveal]")!
        .classList.contains("reveal-pending"),
    ).toBe(true);
  });

  it("un-hides when the element scrolls into view", () => {
    document.body.innerHTML = markup;
    initReveal();
    observers[0]!.callback([
      { isIntersecting: true, target: document.body.firstElementChild! },
    ]);

    expect(
      document
        .querySelector("[data-reveal]")!
        .classList.contains("reveal-pending"),
    ).toBe(false);
  });

  // The degradation paths. Each must leave the element *visible* — the React
  // build declared `initial={{ opacity: 0 }}` in the markup, so any failure to
  // hydrate left the section permanently invisible. An e2e spec asserts the
  // same property from the outside.
  it("leaves the element visible under reduced motion", () => {
    setMatchMedia({ reduce: true });
    document.body.innerHTML = markup;

    initReveal();

    expect(
      document
        .querySelector("[data-reveal]")!
        .classList.contains("reveal-pending"),
    ).toBe(false);
    expect(observers).toHaveLength(0);
  });

  it("leaves the element visible without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    document.body.innerHTML = markup;

    initReveal();

    expect(
      document
        .querySelector("[data-reveal]")!
        .classList.contains("reveal-pending"),
    ).toBe(false);
  });

  it("applies a per-element stagger delay", () => {
    document.body.innerHTML = `<div data-reveal data-reveal-delay="0.3"></div>`;
    initReveal();

    expect(
      document.querySelector<HTMLElement>("[data-reveal]")!.style
        .transitionDelay,
    ).toBe("0.3s");
  });

  it("honours a per-element threshold", () => {
    document.body.innerHTML = `<div data-reveal data-reveal-amount="0.75"></div>`;
    initReveal();

    expect(observers[0]!.options).toMatchObject({ threshold: 0.75 });
  });
});

// ---------------------------------------------------------------------------

describe("scroll-to-top", () => {
  const markup = `<button data-scroll-top hidden></button>`;

  it("stays hidden near the top of the page", () => {
    document.body.innerHTML = markup;
    vi.stubGlobal("scrollY", 0);
    vi.stubGlobal("innerHeight", 800);

    initScrollToTop();

    expect(
      document.querySelector<HTMLButtonElement>("[data-scroll-top]")!.hidden,
    ).toBe(true);
  });

  it("appears past roughly one viewport", () => {
    document.body.innerHTML = markup;
    vi.stubGlobal("scrollY", 1200);
    vi.stubGlobal("innerHeight", 800);

    initScrollToTop();

    expect(
      document.querySelector<HTMLButtonElement>("[data-scroll-top]")!.hidden,
    ).toBe(false);
  });

  it("scrolls back to the top smoothly on click", () => {
    document.body.innerHTML = markup;
    vi.stubGlobal("scrollY", 1200);
    vi.stubGlobal("innerHeight", 800);
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);

    initScrollToTop();
    document.querySelector<HTMLElement>("[data-scroll-top]")!.click();

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});

// ---------------------------------------------------------------------------

describe("toast", () => {
  const markup = `<div data-toaster></div>`;

  it("appends a message into the live region", () => {
    document.body.innerHTML = markup;

    toast("success", "Email sent successfully!");

    const region = document.querySelector("[data-toaster]")!;
    expect(region.children).toHaveLength(1);
    expect(region.textContent).toContain("Email sent successfully!");
  });

  it("renders the message as text, never as markup", () => {
    // The strings come from the server; innerHTML here would be an injection
    // sink one bad error message away from mattering.
    document.body.innerHTML = markup;

    toast("error", "<img src=x onerror=alert(1)>");

    const region = document.querySelector("[data-toaster]")!;
    expect(region.querySelector("img")).toBeNull();
    expect(region.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("distinguishes success from error", () => {
    document.body.innerHTML = markup;

    toast("success", "ok");
    toast("error", "bad");

    const badges = document.querySelectorAll(
      "[data-toaster] span[aria-hidden]",
    );
    expect(badges[0]!.className).toContain("bg-green-500");
    expect(badges[1]!.className).toContain("bg-red-500");
  });

  it("auto-dismisses", () => {
    vi.useFakeTimers();
    document.body.innerHTML = markup;

    toast("success", "gone soon");
    vi.advanceTimersByTime(4000);

    expect(document.querySelector("[data-toaster]")!.children).toHaveLength(0);
  });

  it("does nothing when the region is absent", () => {
    expect(() => toast("success", "nowhere to go")).not.toThrow();
  });
});
