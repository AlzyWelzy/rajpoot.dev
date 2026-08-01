import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, renderHook } from "@testing-library/react";

// Mutable so a single test can drive the observer in/out of view and re-run the
// spy effect (its dep list includes `inView`).
const state = { inView: false };
vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: () => {}, inView: state.inView }),
}));

import { useSectionInView } from "@/lib/hooks";
import ActiveSectionContextProvider, {
  useActiveSectionContext,
} from "@/context/active-section-context";

afterEach(() => {
  cleanup();
  state.inView = false;
});

describe("useSectionInView", () => {
  it("activates a section in view unless a nav-click is settling", () => {
    state.inView = false;
    const { result, rerender } = renderHook(
      () => {
        useSectionInView("Projects");
        return useActiveSectionContext();
      },
      { wrapper: ActiveSectionContextProvider },
    );
    expect(result.current.activeSection).toBe("Home");

    // Suppressed while navigating: inView true but isNavigating() true.
    act(() => result.current.beginNavigation());
    state.inView = true;
    rerender();
    expect(result.current.activeSection).toBe("Home");

    // Navigation settles → spy resumes → section becomes active.
    act(() => {
      fireEvent(window, new Event("scrollend"));
    });
    state.inView = false;
    rerender();
    state.inView = true;
    rerender();
    expect(result.current.activeSection).toBe("Projects");
  });
});
