"use client";

import React, { useEffect, useState } from "react";
import { m } from "motion/react";
import Link from "next/link";
import clsx from "clsx";

import { links } from "@/lib/data";
import { useActiveSectionContext } from "@/context/active-section-context";

export default function Header() {
  const { activeSection, setActiveSection, setTimeOfLastClick } =
    useActiveSectionContext();

  // Scroll-aware state: at the very top the pill floats lightly; once the page
  // scrolls it firms up (more opaque background + deeper shadow) so the links
  // stay legible over whatever content slides underneath. Gated on a boolean so
  // we only re-render when it flips, not on every scroll frame. The CSS
  // transition is neutralized under prefers-reduced-motion (globals.css).
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="z-[999] relative" role="banner">
      <m.nav
        aria-label="Primary"
        className={clsx(
          "fixed top-4 left-1/2 w-[min(100%-1.5rem,24rem)] rounded-3xl border bg-white/80 ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150 transition-[background-color,box-shadow,border-color] duration-300 sm:top-6 sm:w-xl sm:rounded-full",
          "border-white/60 dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/5",
          scrolled
            ? "border-white/70 bg-white/90 shadow-xl shadow-black/8 dark:bg-slate-900/90 dark:shadow-black/50"
            : "shadow-lg shadow-black/5 dark:shadow-black/40",
        )}
        initial={{ y: -100, x: "-50%", opacity: 0 }}
        animate={{ y: 0, x: "-50%", opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
      >
        {/* Mobile (<sm): a 3-column grid lays the six links out as two even rows
            of three so the wrap reads as a deliberate block instead of a ragged
            flex-wrap. From sm up it relaxes into a single nowrap row. */}
        <ul className="grid grid-cols-3 gap-1 p-1.5 text-[0.85rem] font-medium sm:flex sm:h-13 sm:items-center sm:justify-center sm:gap-0.5 sm:p-0 sm:px-1.5 sm:text-[0.9rem]">
          {links.map((link, i) => {
            const isActive = activeSection === link.name;
            return (
              <m.li
                className="relative flex items-center justify-center"
                key={link.hash}
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                  delay: 0.15 + i * 0.05,
                }}
              >
                <Link
                  className={clsx(
                    "relative flex w-full items-center justify-center rounded-full px-2 py-2.5 whitespace-nowrap outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-slate-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent sm:px-3.5 sm:py-2",
                    isActive
                      ? "text-gray-950 dark:text-white"
                      : "text-gray-600 hover:bg-black/5 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/6 dark:hover:text-white",
                  )}
                  href={link.hash}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    setActiveSection(link.name);
                    setTimeOfLastClick(Date.now());
                  }}
                >
                  {link.name}

                  {isActive && (
                    <m.span
                      className="absolute inset-0 -z-10 rounded-full bg-gray-100 shadow-sm ring-1 ring-inset ring-black/5 dark:bg-slate-700/60 dark:shadow-black/20 dark:ring-white/10"
                      layoutId="activeSection"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              </m.li>
            );
          })}
        </ul>
      </m.nav>
    </header>
  );
}
