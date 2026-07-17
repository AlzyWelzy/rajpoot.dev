"use client";

import { BsMoon, BsSun } from "react-icons/bs";

import { useTheme } from "@/context/theme-context";

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-pressed={theme === "dark"}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="fixed bottom-6 right-5 z-50 bg-white/80 w-12 h-12 backdrop-blur-sm border border-white/40 shadow-2xl rounded-full flex items-center justify-center hover:scale-115 active:scale-105 transition-all focus-ring dark:bg-gray-950"
    >
      {/* Stacked icons crossfade + rotate on swap so the most-watched part of
          the interaction has motion. Neutralized by reduced-motion. */}
      <span className="relative block h-[1em] w-[1em]" aria-hidden="true">
        <BsSun
          className={`absolute inset-0 transition-[opacity,transform] duration-300 ${
            theme === "light"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-50 opacity-0"
          }`}
        />
        <BsMoon
          className={`absolute inset-0 transition-[opacity,transform] duration-300 ${
            theme === "dark"
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-50 opacity-0"
          }`}
        />
      </span>
    </button>
  );
}
