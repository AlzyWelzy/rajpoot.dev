"use client";

import { m, useScroll, useSpring } from "motion/react";

/**
 * Thin fixed bar at the top of the viewport that fills left-to-right as the
 * page scrolls, giving a sense of overall position on this long single page.
 * Decorative (aria-hidden); the section nav remains the real wayfinding.
 */
export default function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  // Smooth the raw progress so the bar glides instead of tracking every frame.
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <m.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[998] h-0.5 origin-left bg-gray-900 dark:bg-white/70"
    />
  );
}
