"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function readInitialTheme(): Theme {
  // SSR guard: `document` is always defined on the browser/jsdom render path,
  // so this branch is unreachable from a test — it exists so the module can be
  // imported server-side without throwing.
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

export default function ThemeContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);

  // Applies the theme to the DOM without writing it back to storage. Used by
  // the cross-tab listener, where localStorage is already the source of the
  // change and re-writing it would be a pointless round trip.
  const paintTheme = useCallback((next: Theme) => {
    setThemeState(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
  }, []);

  const applyTheme = useCallback(
    (next: Theme) => {
      paintTheme(next);
      safeSet("theme", next);
    },
    [paintTheme],
  );

  const toggleTheme = useCallback(() => {
    applyTheme(theme === "light" ? "dark" : "light");
  }, [theme, applyTheme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      try {
        if (window.localStorage.getItem("theme")) return;
      } catch {
        /* ignore */
      }
      applyTheme(e.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [applyTheme]);

  useEffect(() => {
    // `storage` fires in every *other* tab of this origin, so toggling the
    // theme in one tab no longer leaves the rest showing the old one. Only
    // the "theme" key matters, and `newValue` is null when the key is removed
    // (or storage cleared), in which case we fall back to the OS preference —
    // which is the same rule readInitialTheme's inline script applies.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== "theme") return;
      const next =
        e.newValue === "dark" || e.newValue === "light"
          ? e.newValue
          : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
      paintTheme(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [paintTheme]);

  const value = useMemo<ThemeContextType>(
    () => ({ theme, toggleTheme, setTheme: applyTheme }),
    [theme, toggleTheme, applyTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error("useTheme must be used within a ThemeContextProvider");
  }
  return context;
}
