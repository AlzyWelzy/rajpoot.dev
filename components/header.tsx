"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import clsx from "clsx";
import { LuMenu, LuX } from "react-icons/lu";

import { links } from "@/lib/data";
import type { SectionName } from "@/lib/types";
import { useActiveSectionContext } from "@/context/active-section-context";

/**
 * Floating primary navigation — Direction D, "Premium minimal with magnetic
 * accent".
 *
 * One elevated glass pill (a single `<nav>` landmark) that adapts per breakpoint:
 *
 * - Desktop (sm+): the full row of links. The active item carries a brand-tinted
 *   gradient indicator (pink → purple + soft glow) that glides between items via
 *   `layoutId="navAccent"`, with a traveling accent dot beneath the label.
 *   Items lift slightly on hover/focus for tactile micro-interaction.
 * - Mobile (<sm): the pill stays compact — gradient monogram + the current
 *   section label — and never wraps. A menu button opens an accessible popover
 *   (aria-expanded / aria-controls, ESC to close, click-outside to close, focus
 *   returns to the trigger) listing all six links, one per row.
 *
 * A single brand-tinted accent system (the #fbe2e3 → #dbd7fb blob palette, and
 * its #946263 → #676394 dark counterpart) ties every state together.
 */

/** Pink → purple gradient monogram chip; doubles as the "scroll to top" link. */
function Monogram({ onActivate }: { onActivate: () => void }) {
  return (
    <Link
      href="#home"
      aria-label="Manvendra Rajpoot — home"
      onClick={onActivate}
      className="focus-ring group flex shrink-0 items-center rounded-full outline-none"
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-[#fbb9bb] to-[#b9b2f5] text-[0.72rem] font-bold tracking-tight text-white shadow-sm ring-1 ring-white/60 transition-transform duration-300 group-hover:scale-105 group-active:scale-95 dark:from-[#946263] dark:to-[#676394] dark:ring-white/15"
      >
        MR
      </span>
    </Link>
  );
}

export default function Header() {
  const { activeSection, setActiveSection, setTimeOfLastClick } =
    useActiveSectionContext();

  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  const handleLinkActivate = useCallback(
    (name: SectionName) => {
      setActiveSection(name);
      setTimeOfLastClick(Date.now());
      setIsOpen(false);
    },
    [setActiveSection, setTimeOfLastClick],
  );

  // While the mobile popover is open: ESC closes it (returning focus to the
  // toggle), and any pointer outside the popover/toggle dismisses it.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !toggleRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen]);

  return (
    <header className="relative z-999" role="banner">
      <m.nav
        aria-label="Primary"
        className={clsx(
          "theme-surface fixed top-4 left-1/2 w-[min(100%-1.5rem,24rem)] rounded-3xl border border-white/55 bg-white/80 shadow-xl shadow-black/[0.07] backdrop-blur-xl sm:top-6 sm:w-max sm:max-w-[calc(100vw-2rem)] sm:rounded-full",
          "dark:border-white/10 dark:bg-gray-900/80 dark:shadow-black/30",
          // Brand-tinted hairline glow that hugs the pill (sm+ only, where it
          // reads as a premium halo rather than crowding the mobile card).
          "sm:before:pointer-events-none sm:before:absolute sm:before:inset-0 sm:before:-z-10 sm:before:rounded-full sm:before:bg-linear-to-r sm:before:from-[#fbe2e3]/60 sm:before:via-transparent sm:before:to-[#dbd7fb]/60 sm:before:opacity-70 sm:before:blur-md sm:before:content-[''] dark:sm:before:from-[#946263]/40 dark:sm:before:to-[#676394]/40",
        )}
        initial={{ y: -100, x: "-50%", opacity: 0 }}
        animate={{ y: 0, x: "-50%", opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
      >
        {/* ---------- Desktop row (sm+) ---------- */}
        <div className="hidden items-center gap-1 px-2 py-1.5 sm:flex">
          <Monogram onActivate={() => handleLinkActivate("Home")} />
          <span
            aria-hidden="true"
            className="mx-1 h-5 w-px bg-gray-200 dark:bg-white/10"
          />
          <ul className="flex items-center gap-0.5 text-[0.9rem] font-medium">
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
                      "focus-ring relative flex items-center justify-center rounded-full px-3.5 py-2 whitespace-nowrap outline-none transition-[color,transform] duration-200 hover:-translate-y-0.5 focus-visible:-translate-y-0.5",
                      isActive
                        ? "text-gray-950 dark:text-white"
                        : "text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white",
                    )}
                    href={link.hash}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => handleLinkActivate(link.name)}
                  >
                    <span className="relative z-10">{link.name}</span>

                    {isActive && (
                      <>
                        {/* Magnetic gradient pill — brand pink → purple + glow. */}
                        <m.span
                          aria-hidden="true"
                          layoutId="navAccent"
                          className="absolute inset-0 rounded-full bg-linear-to-r from-[#fbe2e3] to-[#dbd7fb] shadow-[0_4px_18px_-4px_rgba(219,215,251,0.9)] ring-1 ring-white/60 dark:from-[#946263]/70 dark:to-[#676394]/70 dark:shadow-[0_4px_18px_-6px_rgba(103,99,148,0.8)] dark:ring-white/10"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                        {/* Traveling accent dot beneath the active label. */}
                        <m.span
                          aria-hidden="true"
                          layoutId="navAccentDot"
                          className="absolute -bottom-0.5 left-1/2 z-10 h-1 w-1 -translate-x-1/2 rounded-full bg-gray-900/70 dark:bg-white/80"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      </>
                    )}
                  </Link>
                </m.li>
              );
            })}
          </ul>
        </div>

        {/* ---------- Mobile compact bar (<sm) ---------- */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:hidden">
          <div className="flex items-center gap-2 overflow-hidden">
            <Monogram onActivate={() => handleLinkActivate("Home")} />
            <span
              aria-hidden="true"
              className="text-sm text-gray-400 dark:text-gray-500"
            >
              /
            </span>
            <span className="relative inline-flex overflow-hidden text-sm font-semibold text-gray-900 dark:text-white">
              <AnimatePresence mode="popLayout" initial={false}>
                <m.span
                  key={activeSection}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="inline-block whitespace-nowrap"
                >
                  {activeSection}
                </m.span>
              </AnimatePresence>
            </span>
          </div>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls={menuId}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            className="focus-ring relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-700 outline-none transition-colors hover:bg-gray-100 active:scale-95 dark:text-gray-200 dark:hover:bg-white/10"
          >
            <AnimatePresence initial={false} mode="wait">
              {isOpen ? (
                <m.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex"
                >
                  <LuX className="h-5 w-5" aria-hidden="true" />
                </m.span>
              ) : (
                <m.span
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex"
                >
                  <LuMenu className="h-5 w-5" aria-hidden="true" />
                </m.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* ---------- Mobile popover ---------- */}
        <AnimatePresence>
          {isOpen && (
            <m.div
              id={menuId}
              ref={menuRef}
              key="sheet"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="theme-surface absolute top-[calc(100%+0.5rem)] right-0 left-0 origin-top overflow-hidden rounded-3xl border border-white/55 bg-white/90 p-2 shadow-xl shadow-black/10 backdrop-blur-xl sm:hidden dark:border-white/10 dark:bg-gray-900/90 dark:shadow-black/40"
            >
              <ul className="flex flex-col gap-1 text-[0.95rem] font-medium">
                {links.map((link) => {
                  const isActive = activeSection === link.name;
                  return (
                    <li key={link.hash}>
                      <Link
                        href={link.hash}
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => handleLinkActivate(link.name)}
                        className={clsx(
                          "focus-ring flex items-center justify-between rounded-2xl px-4 py-3 outline-none transition-colors",
                          isActive
                            ? "bg-linear-to-r from-[#fbe2e3] to-[#dbd7fb] text-gray-950 shadow-sm dark:from-[#946263]/65 dark:to-[#676394]/65 dark:text-white"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10",
                        )}
                      >
                        {link.name}
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 rounded-full bg-gray-900/70 dark:bg-white/80"
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </m.div>
          )}
        </AnimatePresence>
      </m.nav>
    </header>
  );
}
