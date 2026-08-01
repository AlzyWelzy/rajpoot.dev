import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import ThemeContextProvider, { useTheme } from "./theme-context";

function Probe() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>theme:{theme}</button>;
}

function renderProbe() {
  return render(
    <ThemeContextProvider>
      <Probe />
    </ThemeContextProvider>,
  );
}

describe("ThemeContextProvider", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
  });

  it("initializes from the html class set by the inline theme script", () => {
    document.documentElement.classList.add("dark");
    renderProbe();
    expect(screen.getByRole("button")).toHaveTextContent("theme:dark");
  });

  it("toggling applies the class, color-scheme and persists the choice", () => {
    renderProbe();
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("theme:light");

    fireEvent.click(button);

    expect(button).toHaveTextContent("theme:dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(window.localStorage.getItem("theme")).toBe("dark");

    fireEvent.click(button);

    expect(button).toHaveTextContent("theme:light");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(window.localStorage.getItem("theme")).toBe("light");
  });

  it("follows a theme change made in another tab", () => {
    renderProbe();
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("theme:light");

    // `storage` only fires in the *other* tabs of an origin, so this is the
    // event a second tab would receive after the first one toggled.
    fireEvent(
      window,
      new StorageEvent("storage", { key: "theme", newValue: "dark" }),
    );

    expect(button).toHaveTextContent("theme:dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("ignores storage events for unrelated keys", () => {
    renderProbe();
    fireEvent(
      window,
      new StorageEvent("storage", { key: "something-else", newValue: "dark" }),
    );
    expect(screen.getByRole("button")).toHaveTextContent("theme:light");
  });

  it("falls back to the OS preference when the stored theme is cleared", () => {
    document.documentElement.classList.add("dark");
    renderProbe();
    expect(screen.getByRole("button")).toHaveTextContent("theme:dark");

    // A cleared key arrives as newValue: null — as does a whole-storage clear,
    // which reports key: null.
    fireEvent(
      window,
      new StorageEvent("storage", { key: "theme", newValue: null }),
    );

    // jsdom's matchMedia stub reports no match, i.e. light.
    expect(screen.getByRole("button")).toHaveTextContent("theme:light");
  });

  it("throws a clear error when useTheme is used outside the provider", () => {
    expect(() => render(<Probe />)).toThrow(
      /useTheme must be used within a ThemeContextProvider/,
    );
  });
});
