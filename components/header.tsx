"use client";

import { m } from "motion/react";
import Link from "next/link";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

import { links } from "@/lib/data";
import { useActiveSectionContext } from "@/context/active-section-context";

type PillBox = { left: number; top: number; width: number; height: number };

export default function Header() {
  const { activeSection, setActiveSection, beginNavigation } =
    useActiveSectionContext();

  // The active pill used to be a motion `layoutId` shared-element animation,
  // which was the single reason the whole app had to load motion's `domMax`
  // feature bundle. Measuring the active item and moving one absolutely
  // positioned span with a CSS transform transition gives the same sliding
  // pill, and lets MotionProvider drop to the much smaller `domAnimation`.
  const listRef = useRef<HTMLUListElement>(null);
  const [pill, setPill] = useState<PillBox | null>(null);

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) {
      setPill(null);
      return;
    }
    // offsetLeft/Top are relative to the ul (the nearest positioned ancestor),
    // which is exactly the coordinate space the pill is placed in.
    setPill({
      left: active.offsetLeft,
      top: active.offsetTop,
      width: active.offsetWidth,
      height: active.offsetHeight,
    });
  }, []);

  useEffect(() => {
    measure();
  }, [measure, activeSection]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    // The nav wraps to two rows on narrow viewports, so the pill has to be
    // re-measured whenever the list's own box changes, not just on resize.
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [measure]);

  // No role="banner": a <header> that isn't nested inside a sectioning element
  // already exposes the banner landmark, so restating it is redundant.
  return (
    <header className="z-[999] relative">
      <m.nav
        aria-label="Primary"
        className="fixed top-4 left-1/2 flex w-[min(100%-1.5rem,24rem)] items-center justify-center rounded-3xl border border-white/60 bg-white/80 shadow-lg shadow-black/5 ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150 sm:top-6 sm:w-xl sm:rounded-full dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/40 dark:ring-white/5"
        initial={{ y: -100, x: "-50%", opacity: 0 }}
        animate={{ y: 0, x: "-50%", opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
      >
        <ul
          ref={listRef}
          className="relative flex min-h-13 flex-wrap items-center justify-center gap-x-1 gap-y-0.5 px-2 py-1.5 text-[0.85rem] font-medium sm:h-13 sm:min-h-[initial] sm:flex-nowrap sm:gap-0.5 sm:px-1.5 sm:py-0 sm:text-[0.9rem]"
        >
          <span
            aria-hidden="true"
            data-testid="active-pill"
            className="pointer-events-none absolute left-0 top-0 -z-10 rounded-full bg-gray-100 shadow-sm ring-1 ring-inset ring-black/5 transition-[transform,width,height,opacity] duration-300 ease-out motion-reduce:transition-none dark:bg-slate-700/60 dark:shadow-black/20 dark:ring-white/10"
            style={
              pill
                ? {
                    transform: `translate3d(${pill.left}px, ${pill.top}px, 0)`,
                    width: pill.width,
                    height: pill.height,
                    opacity: 1,
                  }
                : { opacity: 0 }
            }
          />

          {links.map((link, i) => (
            <m.li
              className="flex items-center justify-center relative"
              key={link.hash}
              data-active={activeSection === link.name ? "true" : undefined}
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
                  "relative flex w-full items-center justify-center rounded-full px-2.5 py-2 text-gray-600 outline-none transition-colors duration-200 hover:text-gray-950 focus-visible:ring-2 focus-visible:ring-slate-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent sm:px-3.5 sm:py-2 dark:text-gray-300 dark:hover:text-white",
                  {
                    "text-gray-950 dark:text-white":
                      activeSection === link.name,
                    "hover:bg-black/5 dark:hover:bg-white/6":
                      activeSection !== link.name,
                  },
                )}
                href={link.hash}
                aria-current={activeSection === link.name ? "page" : undefined}
                onClick={() => {
                  setActiveSection(link.name);
                  beginNavigation();
                }}
              >
                {link.name}
              </Link>
            </m.li>
          ))}
        </ul>
      </m.nav>
    </header>
  );
}
