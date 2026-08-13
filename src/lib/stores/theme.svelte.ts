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

// Wrapped in an object rather than exporting a bare `$state` primitive —
// every consumer (Svelte islands, or a plain <script> in an .astro file)
// reads/writes `themeState.value`, which is unambiguous across that
// boundary regardless of how the importing context handles live bindings.
export const themeState = $state<{ value: Theme }>({
  value: readInitialTheme(),
});

// Applies the theme to the DOM without writing it back to storage. Used by
// the cross-tab listener below, where localStorage is already the source of
// the change and re-writing it would be a pointless round trip.
function paintTheme(next: Theme) {
  themeState.value = next;
  const root = document.documentElement;
  root.classList.toggle("dark", next === "dark");
  root.style.colorScheme = next;
}

export function setTheme(next: Theme) {
  paintTheme(next);
  safeSet("theme", next);
}

export function toggleTheme() {
  setTheme(themeState.value === "light" ? "dark" : "light");
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
