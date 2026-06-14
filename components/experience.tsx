"use client";

import dynamic from "next/dynamic";

import SectionHeading from "./section-heading";
import { useSectionInView } from "@/lib/hooks";

// Code-split the heavy timeline library + its CSS into a separate chunk.
// ssr stays true (the default), so the experience content is still
// server-rendered and indexable.
const ExperienceTimeline = dynamic(() => import("./experience-timeline"));

export default function Experience() {
  const { ref } = useSectionInView("Experience", 0.1);

  return (
    <section
      id="experience"
      ref={ref}
      aria-label="Experience and education"
      className="scroll-mt-28 mb-28 sm:mb-40"
    >
      <SectionHeading>My experience</SectionHeading>
      <ExperienceTimeline />
    </section>
  );
}
