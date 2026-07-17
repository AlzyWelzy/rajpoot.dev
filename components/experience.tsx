"use client";

import SectionHeading from "./section-heading";
import ExperienceTimeline from "./experience-timeline";
import { useSectionInView } from "@/lib/hooks";

export default function Experience() {
  const { ref } = useSectionInView("Experience");

  return (
    <section
      id="experience"
      ref={ref}
      tabIndex={-1}
      aria-label="Experience and education"
      className="scroll-mt-28 mb-28 outline-none sm:mb-40"
    >
      <SectionHeading>My experience</SectionHeading>
      <ExperienceTimeline />
    </section>
  );
}
