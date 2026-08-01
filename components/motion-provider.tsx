"use client";

import React from "react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

/**
 * Loads motion's DOM features once and lazily, so individual `m.*` components
 * stay tiny in the client bundle instead of each pulling in the full library.
 *
 * `domAnimation` covers animations, variants, exit animations and hover/tap
 * gestures — everything this site actually uses. It is roughly half the size
 * of `domMax`, whose extra weight is drag/pan and layout animations; the only
 * consumer of those was the header's shared-element active pill, which now
 * moves via a measured CSS transform instead (see components/header.tsx).
 *
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
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
