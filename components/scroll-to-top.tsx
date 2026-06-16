"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { BsArrowUp } from "react-icons/bs";

/**
 * Floating button (bottom-left, mirroring the bottom-right ThemeSwitch) that
 * appears once the user has scrolled past ~one viewport and smooth-scrolls back
 * to the top — saving a long manual scroll on this single-page site.
 */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <m.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll back to top"
          title="Back to top"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          className="fixed bottom-6 left-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/80 shadow-2xl backdrop-blur-sm transition-all hover:scale-115 active:scale-105 focus-ring dark:bg-gray-950"
        >
          <BsArrowUp aria-hidden="true" />
        </m.button>
      )}
    </AnimatePresence>
  );
}
