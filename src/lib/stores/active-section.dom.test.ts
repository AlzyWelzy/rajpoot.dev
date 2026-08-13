import { afterEach, describe, expect, it, vi } from "vitest";

import {
  activeSectionState,
  beginNavigation,
  isNavigating,
} from "./active-section.svelte";

afterEach(() => {
  vi.useRealTimers();
});

describe("active-section store", () => {
  it("defaults to Home", () => {
    expect(activeSectionState.value).toBe("Home");
  });

  it("clears suppression via the fallback timer and via scrollend", () => {
    vi.useFakeTimers();

    // scrollend with no pending timer (nothing to clear yet).
    window.dispatchEvent(new Event("scrollend"));
    expect(isNavigating()).toBe(false);

    beginNavigation();
    expect(isNavigating()).toBe(true);

    // A second call clears the previous fallback timer before setting a new one.
    beginNavigation();
    expect(isNavigating()).toBe(true);

    // No scrollend arrives → the 1s fallback resets navigation.
    vi.advanceTimersByTime(1000);
    expect(isNavigating()).toBe(false);

    // scrollend resets immediately and clears the pending timer.
    beginNavigation();
    window.dispatchEvent(new Event("scrollend"));
    expect(isNavigating()).toBe(false);
  });
});
