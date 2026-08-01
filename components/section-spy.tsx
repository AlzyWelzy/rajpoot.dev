"use client";

import { m } from "motion/react";
import type { ReactNode } from "react";

import { useSectionInView } from "@/lib/hooks";
import type { SectionName } from "@/lib/types";

type SectionSpyProps = {
  /** Nav entry this section represents; drives the header's active pill. */
  section: SectionName;
  id: string;
  "aria-label": string;
  className?: string;
  /** Fade + rise the section the first time it scrolls into view. */
  reveal?: boolean;
  children: ReactNode;
};

/**
 * The only client-side part of a content section: the scroll-spy ref (and an
 * optional one-shot reveal). Everything inside arrives as already-rendered
 * server children, so section prose and data stay out of the client bundle
 * instead of every section being `"use client"` just to observe itself.
 */
export default function SectionSpy({
  section,
  reveal = false,
  children,
  ...props
}: SectionSpyProps) {
  const { ref } = useSectionInView(section);
  // tabIndex -1 makes the section a programmatic focus target for the nav
  // links and the skip link without putting it in the tab order.
  const shared = { ref, tabIndex: -1, ...props };

  if (!reveal) return <section {...shared}>{children}</section>;

  return (
    <m.section
      {...shared}
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: 0.175 }}
    >
      {children}
    </m.section>
  );
}
