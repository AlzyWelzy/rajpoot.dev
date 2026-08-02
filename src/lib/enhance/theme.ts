export type Theme = "light" | "dark";

/**
 * Dark-mode toggle.
 *
 * The theme is already applied to <html> before first paint by the inline
 * script in app.html — that script is the source of truth for the *initial*
 * state, including the toggle's aria-label. This module only handles changes:
 * the click, the OS preference, and other tabs.
 */

function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Safari private mode, storage disabled — the toggle still works. */
  }
}

function storedTheme(): string | null {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
}

/** Applies a theme to the DOM. Does not write storage — see `apply`. */
export function paint(next: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", next === "dark");
  root.style.colorScheme = next;

  // Keep the control's accessible name describing what the click will *do*,
  // not what the current state is.
  const label = `Switch to ${next === "light" ? "dark" : "light"} mode`;
  for (const button of document.querySelectorAll<HTMLElement>(
    "[data-theme-toggle]",
  )) {
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.setAttribute("aria-pressed", String(next === "dark"));
  }
}

export function apply(next: Theme) {
  paint(next);
  safeSet("theme", next);
}

export function initTheme() {
  for (const button of document.querySelectorAll<HTMLElement>(
    "[data-theme-toggle]",
  )) {
    button.addEventListener("click", () => {
      apply(currentTheme() === "light" ? "dark" : "light");
    });
  }

  const media = matchMedia("(prefers-color-scheme: dark)");

  // Follow the OS only while the visitor has never made an explicit choice.
  media.addEventListener("change", (event) => {
    if (storedTheme()) return;
    apply(event.matches ? "dark" : "light");
  });

  // `storage` fires in every *other* tab of this origin, so toggling the theme
  // in one tab no longer leaves the rest showing the old one. `newValue` is
  // null when the key is removed or storage is cleared, in which case we fall
  // back to the OS preference — the same rule app.html's inline script applies.
  addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== "theme") return;
    const next =
      event.newValue === "dark" || event.newValue === "light"
        ? event.newValue
        : media.matches
          ? "dark"
          : "light";
    paint(next);
  });
}
