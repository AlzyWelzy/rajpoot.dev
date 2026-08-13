import { afterEach, describe, expect, it } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/svelte";

import ThemeSwitch from "./ThemeSwitch.svelte";
import { setTheme } from "@/lib/stores/theme.svelte";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  setTheme("light");
});

describe("ThemeSwitch", () => {
  it("labels itself by the theme it would switch to, and toggles on click", async () => {
    setTheme("light");
    const { getByRole } = render(ThemeSwitch);

    const button = getByRole("button", { name: /switch to dark mode/i });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await fireEvent.click(button);

    expect(
      getByRole("button", { name: /switch to light mode/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
