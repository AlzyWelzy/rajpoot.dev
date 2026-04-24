"use client";

import React from "react";
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
      className="fixed bottom-5 right-5 z-50 bg-white w-[3rem] h-[3rem] bg-opacity-80 backdrop-blur-[0.5rem] border border-white border-opacity-40 shadow-2xl rounded-full flex items-center justify-center hover:scale-[1.15] active:scale-105 transition-all focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 dark:bg-gray-950"
    >
      {theme === "light" ? <BsSun aria-hidden="true" /> : <BsMoon aria-hidden="true" />}
    </button>
  );
}
