import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import ActiveSectionContextProvider, {
  useActiveSectionContext,
} from "./active-section-context";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ActiveSectionContext navigation suppression", () => {
  it("clears suppression via the fallback timer and via scrollend", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useActiveSectionContext(), {
      wrapper: ActiveSectionContextProvider,
    });

    // scrollend with no pending timer (nothing to clear yet).
    act(() => {
      window.dispatchEvent(new Event("scrollend"));
    });
    expect(result.current.isNavigating()).toBe(false);

    act(() => result.current.beginNavigation());
    expect(result.current.isNavigating()).toBe(true);

    // A second call clears the previous fallback timer before setting a new one.
    act(() => result.current.beginNavigation());
    expect(result.current.isNavigating()).toBe(true);

    // No scrollend arrives → the 1s fallback resets navigation.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.isNavigating()).toBe(false);

    // scrollend resets immediately and clears the pending timer.
    act(() => result.current.beginNavigation());
    act(() => {
      window.dispatchEvent(new Event("scrollend"));
    });
    expect(result.current.isNavigating()).toBe(false);
  });
});
