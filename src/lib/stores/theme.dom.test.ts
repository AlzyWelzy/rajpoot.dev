import { afterEach, describe, expect, it } from "vitest";

import { themeState, setTheme, toggleTheme, subscribeTheme } from "./theme";

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  setTheme("light");
});

describe("theme store", () => {
  it("applies the dark class and color-scheme, and persists the choice", () => {
    setTheme("dark");

    expect(themeState.value).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("removes the dark class when switching back to light", () => {
    setTheme("dark");
    setTheme("light");

    expect(themeState.value).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("toggleTheme flips between light and dark", () => {
    setTheme("light");

    toggleTheme();
    expect(themeState.value).toBe("dark");

    toggleTheme();
    expect(themeState.value).toBe("light");
  });

  it("notifies subscribers on change, and stops after unsubscribe", () => {
    const seen: string[] = [];
    const unsubscribe = subscribeTheme((value) => seen.push(value));

    setTheme("dark");
    expect(seen).toEqual(["dark"]);

    unsubscribe();
    setTheme("light");
    expect(seen).toEqual(["dark"]);
    expect(themeState.value).toBe("light");
  });
});
