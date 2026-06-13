"use client";

import React from "react";
import { LazyMotion, MotionConfig, domMax } from "motion/react";

/**
 * Loads motion's DOM features once and lazily, so individual `m.*` components
 * stay tiny in the client bundle instead of each pulling in the full library.
 * `domMax` includes layout animations (used by the header nav indicator);
 * `strict` enforces that every animated element uses `m.*` (not `motion.*`).
 *
 * `MotionConfig reducedMotion="user"` makes every motion animation honor the
 * user's `prefers-reduced-motion` setting — the CSS-only rule in globals.css
 * can't stop JS-driven animations, so this closes that accessibility gap.
 */
export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domMax} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
