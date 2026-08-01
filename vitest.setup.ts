// Adds jest-dom matchers (toBeInTheDocument, toHaveClass, ...) to Vitest's
// expect for the jsdom component-test project.
import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement ResizeObserver, which the header uses to re-measure
// the active-section pill when the nav wraps. Without it the component would
// silently take its "unsupported" branch in every test.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// jsdom doesn't implement matchMedia, which theme-context relies on.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
