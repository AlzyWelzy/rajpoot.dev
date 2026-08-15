import { afterEach, describe, expect, it, vi } from "vitest";

import {
  activeSectionState,
  beginNavigation,
  isNavigating,
  subscribeActiveSection,
} from "./active-section";

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

  it("notifies subscribers on change, and stops after unsubscribe", () => {
    const seen: string[] = [];
    const unsubscribe = subscribeActiveSection((value) => seen.push(value));

    activeSectionState.value = "About";
    activeSectionState.value = "Projects";
    expect(seen).toEqual(["About", "Projects"]);

    unsubscribe();
    activeSectionState.value = "Skills";
    expect(seen).toEqual(["About", "Projects"]);
    // The value still updates; only the notification stopped.
    expect(activeSectionState.value).toBe("Skills");
  });

  it("does not notify when the value is unchanged", () => {
    activeSectionState.value = "Contact";
    const seen: string[] = [];
    const unsubscribe = subscribeActiveSection((value) => seen.push(value));

    activeSectionState.value = "Contact";

    expect(seen).toEqual([]);
    unsubscribe();
  });
});
