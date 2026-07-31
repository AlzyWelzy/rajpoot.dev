import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import ThemeContextProvider, { useTheme } from "./theme-context";

let changeHandler: ((e: { matches: boolean }) => void) | undefined;

beforeEach(() => {
  changeHandler = undefined;
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: (
      _event: string,
      cb: (e: { matches: boolean }) => void,
    ) => {
      changeHandler = cb;
    },
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

function renderTheme() {
  return renderHook(() => useTheme(), { wrapper: ThemeContextProvider });
}

describe("ThemeContext system-preference sync", () => {
  // applyTheme persists a preference, so each direction needs a fresh mount
  // (afterEach clears localStorage) to exercise it as an "unstored" change.
  it("switches to dark on an OS change when no theme is stored", () => {
    localStorage.removeItem("theme");
    const { result } = renderTheme();
    act(() => changeHandler?.({ matches: true }));
    expect(result.current.theme).toBe("dark");
  });

  it("switches to light on an OS change when no theme is stored", () => {
    localStorage.removeItem("theme");
    const { result } = renderTheme();
    act(() => changeHandler?.({ matches: false }));
    expect(result.current.theme).toBe("light");
  });

  it("ignores OS changes when a theme is explicitly stored", () => {
    localStorage.setItem("theme", "light");
    const { result } = renderTheme();
    act(() => changeHandler?.({ matches: true }));
    expect(result.current.theme).toBe("light");
  });
});
