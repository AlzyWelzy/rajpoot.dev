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

  it("throws a clear error when useTheme is used outside the provider", () => {
    expect(() => render(<Probe />)).toThrow(
      /useTheme must be used within a ThemeContextProvider/,
    );
  });
});
