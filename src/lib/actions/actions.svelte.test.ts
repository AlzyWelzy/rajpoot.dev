import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { reveal } from "./reveal";
import { sectionSpy } from "./section-spy";
import { activeSection } from "../state/active-section.svelte";

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

let observers: {
  callback: ObserverCallback;
  options: IntersectionObserverInit | undefined;
  observe: Mock<() => void>;
  disconnect: Mock<() => void>;
}[] = [];

function stubIntersectionObserver() {
  observers = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(
        public callback: ObserverCallback,
        public options?: IntersectionObserverInit,
      ) {
        observers.push({
          callback,
          options,
          observe: vi.fn<() => void>(),
          disconnect: vi.fn<() => void>(),
        });
      }
      observe = () => observers.at(-1)!.observe();
      disconnect = () => observers.at(-1)!.disconnect();
    },
  );
}

function setReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: reduce && query.includes("reduce"),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

beforeEach(() => {
  stubIntersectionObserver();
  setReducedMotion(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("reveal", () => {
  it("hides the element only once it can also un-hide it", () => {
    const node = document.createElement("div");
    reveal(node, {});
    expect(node.classList.contains("reveal-pending")).toBe(true);
  });

  it("un-hides when the element scrolls into view", () => {
    const node = document.createElement("div");
    reveal(node, {});

    observers[0]!.callback([{ isIntersecting: true }]);
    expect(node.classList.contains("reveal-pending")).toBe(false);
  });

  it("stays hidden while out of view", () => {
    const node = document.createElement("div");
    reveal(node, {});

    observers[0]!.callback([{ isIntersecting: false }]);
    expect(node.classList.contains("reveal-pending")).toBe(true);
  });

  // The three degradation paths. Each one must leave the element *visible* —
  // the React build declared `initial={{ opacity: 0 }}` in the markup, so any
  // failure to hydrate left the section permanently invisible. There is an e2e
  // spec asserting the same property from the outside.
  it("leaves the element visible when reduced motion is requested", () => {
    setReducedMotion(true);
    const node = document.createElement("div");

    reveal(node, {});

    expect(node.classList.contains("reveal-pending")).toBe(false);
    expect(observers).toHaveLength(0);
  });

  it("leaves the element visible without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const node = document.createElement("div");

    reveal(node, {});

    expect(node.classList.contains("reveal-pending")).toBe(false);
  });

  it("leaves the element visible when disabled", () => {
    const node = document.createElement("div");

    reveal(node, { enabled: false });

    expect(node.classList.contains("reveal-pending")).toBe(false);
    expect(observers).toHaveLength(0);
  });

  it("applies the stagger delay as a transition delay", () => {
    const node = document.createElement("div");
    reveal(node, { delay: 0.3 });
    expect(node.style.transitionDelay).toBe("0.3s");
  });

  it("disconnects on destroy", () => {
    const node = document.createElement("div");
    const handle = reveal(node, {});
    handle.destroy?.();
    expect(observers[0]!.disconnect).toHaveBeenCalled();
  });
});

describe("sectionSpy", () => {
  it("marks the section active when it enters the header band", () => {
    activeSection.set("Home");
    const node = document.createElement("section");

    sectionSpy(node, "Projects");
    observers[0]!.callback([{ isIntersecting: true }]);

    expect(activeSection.current).toBe("Projects");
  });

  it("ignores sections passing by during a nav click", () => {
    // Suppression is what stops the pill stuttering through every section a
    // long smooth-scroll crosses.
    activeSection.set("Home");
    activeSection.beginNavigation();
    const node = document.createElement("section");

    sectionSpy(node, "Skills");
    observers[0]!.callback([{ isIntersecting: true }]);

    expect(activeSection.current).toBe("Home");
  });

  it("observes with the header-band geometry", () => {
    // The negative top margin shrinks the viewport to roughly the fixed
    // header's line; the large negative bottom keeps one section active at a
    // time. A threshold of 0 lets tall sections register at all.
    sectionSpy(document.createElement("section"), "About");

    expect(observers[0]!.options).toMatchObject({
      rootMargin: "-25% 0px -55% 0px",
      threshold: 0,
    });
  });

  it("disconnects on destroy", () => {
    const handle = sectionSpy(document.createElement("section"), "About");
    handle.destroy();
    expect(observers[0]!.disconnect).toHaveBeenCalled();
  });
});
