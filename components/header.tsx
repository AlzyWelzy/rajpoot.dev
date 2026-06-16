"use client";

import React from "react";
import { m } from "motion/react";
import Link from "next/link";
import clsx from "clsx";

import { links } from "@/lib/data";
import { useActiveSectionContext } from "@/context/active-section-context";

export default function Header() {
  const { activeSection, setActiveSection, setTimeOfLastClick } =
    useActiveSectionContext();

  return (
    <header className="z-[999] relative" role="banner">
      <m.nav
        aria-label="Primary"
        className="fixed top-4 left-1/2 flex w-[min(100%-1.5rem,24rem)] items-center justify-center rounded-3xl border border-white/50 bg-white/85 shadow-lg shadow-black/5 backdrop-blur-md sm:top-6 sm:w-xl sm:rounded-full dark:border-white/10 dark:bg-slate-900/85 dark:shadow-black/30"
        initial={{ y: -100, x: "-50%", opacity: 0 }}
        animate={{ y: 0, x: "-50%", opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
      >
        <ul className="flex min-h-13 flex-wrap items-center justify-center gap-x-1 gap-y-0.5 px-2 py-1.5 text-[0.85rem] font-medium sm:h-13 sm:min-h-[initial] sm:flex-nowrap sm:gap-0.5 sm:px-1.5 sm:py-0 sm:text-[0.9rem]">
          {links.map((link, i) => (
            <m.li
              className="flex items-center justify-center relative"
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
                  "flex w-full items-center justify-center rounded-full px-2.5 py-2 text-gray-600 hover:text-gray-950 transition sm:px-3.5 sm:py-2 dark:text-gray-300 dark:hover:text-white",
                  {
                    "text-gray-950 dark:text-white":
                      activeSection === link.name,
                  },
                )}
                href={link.hash}
                aria-current={activeSection === link.name ? "page" : undefined}
                onClick={() => {
                  setActiveSection(link.name);
                  setTimeOfLastClick(Date.now());
                }}
              >
                {link.name}

                {link.name === activeSection && (
                  <m.span
                    className="rounded-full absolute inset-0 -z-10 bg-gray-100 ring-1 ring-inset ring-black/5 dark:bg-slate-700/60 dark:ring-white/10"
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
          ))}
        </ul>
      </m.nav>
    </header>
  );
}
