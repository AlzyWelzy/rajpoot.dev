import { browser } from "$app/environment";

export type Theme = "light" | "dark";

function readInitialTheme(): Theme {
  // The inline script in app.html has already applied the stored/OS theme to
  // <html> before first paint, so the DOM — not localStorage — is the truth
  // here. On the server there is no document; "light" keeps the prerendered
  // markup deterministic, and the inline script corrects it before paint.
  if (!browser) return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* Safari private mode, storage disabled — the toggle still works. */
  }
}

class ThemeState {
  current = $state<Theme>(readInitialTheme());

  /**
   * Applies a theme to the DOM without writing it back to storage. Used by the
   * cross-tab listener, where localStorage is already the source of the change
   * and re-writing it would be a pointless round trip.
   */
  paint(next: Theme) {
    this.current = next;
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
  }

  apply(next: Theme) {
    this.paint(next);
    safeSet("theme", next);
  }

  toggle() {
    this.apply(this.current === "light" ? "dark" : "light");
  }

  /**
   * Wires the two ambient sources of theme change. Returns a teardown, so the
   * caller can hand it straight to `$effect`.
   */
  listen(): () => void {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    // Follow the OS only while the visitor has never made an explicit choice.
    const onMediaChange = (e: MediaQueryListEvent) => {
      try {
        if (window.localStorage.getItem("theme")) return;
      } catch {
        /* ignore */
      }
      this.apply(e.matches ? "dark" : "light");
    };

    // `storage` fires in every *other* tab of this origin, so toggling the
    // theme in one tab no longer leaves the rest showing the old one. Only the
    // "theme" key matters, and `newValue` is null when the key is removed (or
    // storage cleared), in which case we fall back to the OS preference —
    // the same rule the inline script in app.html applies.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== "theme") return;
      const next =
        e.newValue === "dark" || e.newValue === "light"
          ? e.newValue
          : media.matches
            ? "dark"
            : "light";
      this.paint(next);
    };

    media.addEventListener("change", onMediaChange);
    window.addEventListener("storage", onStorage);

    return () => {
      media.removeEventListener("change", onMediaChange);
      window.removeEventListener("storage", onStorage);
    };
  }
}

export const theme = new ThemeState();
