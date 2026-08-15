export type Theme = "light" | "dark";

function readInitialTheme(): Theme {
  // SSR guard: `document` is always defined on the browser render path, so
  // this branch only matters if this module is ever evaluated during
  // prerendering.
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* noop */
  }
}

// Exported as an object with a `value` accessor rather than a bare `let`, so
// every consumer — the toggle button, the cross-tab listener — reads and
// writes the same property across the ESM boundary.
let current: Theme = readInitialTheme();
const subscribers = new Set<(value: Theme) => void>();

export const themeState = {
  get value(): Theme {
    return current;
  },
};

/** Fires on every change. Returns an unsubscribe function. */
export function subscribeTheme(fn: (value: Theme) => void) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

// Applies the theme to the DOM without writing it back to storage. Used by
// the cross-tab listener below, where localStorage is already the source of
// the change and re-writing it would be a pointless round trip.
function paintTheme(next: Theme) {
  current = next;
  const root = document.documentElement;
  root.classList.toggle("dark", next === "dark");
  root.style.colorScheme = next;
  for (const fn of subscribers) fn(next);
}

export function setTheme(next: Theme) {
  paintTheme(next);
  safeSet("theme", next);
}

export function toggleTheme() {
  setTheme(current === "light" ? "dark" : "light");
}

if (typeof window !== "undefined") {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", (e) => {
    try {
      if (window.localStorage.getItem("theme")) return;
    } catch {
      /* ignore */
    }
    paintTheme(e.matches ? "dark" : "light");
  });

  // `storage` fires in every *other* tab of this origin, so toggling the
  // theme in one tab no longer leaves the rest showing the old one. Only the
  // "theme" key matters, and `newValue` is null when the key is removed (or
  // storage cleared), in which case we fall back to the OS preference —
  // same rule the pre-hydration inline script in BaseLayout.astro applies.
  window.addEventListener("storage", (e) => {
    if (e.key !== null && e.key !== "theme") return;
    const next =
      e.newValue === "dark" || e.newValue === "light"
        ? e.newValue
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    paintTheme(next);
  });
}
