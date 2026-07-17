// Adds jest-dom matchers (toBeInTheDocument, toHaveClass, ...) to Vitest's
// expect for the jsdom component-test project.
import "@testing-library/jest-dom/vitest";

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
