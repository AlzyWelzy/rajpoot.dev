// Adds jest-dom matchers (toBeInTheDocument, toHaveClass, ...) to Vitest's
// expect for the jsdom "dom" test project.
import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement ResizeObserver, which Header.svelte uses to
// re-measure the active-section pill when the nav wraps.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// jsdom doesn't implement matchMedia, which the theme store reads at import
// time to register its prefers-color-scheme listener.
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
