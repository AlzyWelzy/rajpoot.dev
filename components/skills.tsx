"use client";

import { m } from "motion/react";

import SectionHeading from "./section-heading";
import { skillsData } from "@/lib/data";
import { useSectionInView } from "@/lib/hooks";

const fadeInAnimationVariants = {
  initial: { opacity: 0, y: 24 },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    // Cap the stagger so the last of 32 chips doesn't wait over a second — the
    // section settles in ~0.3s instead of heaving in.
    transition: { delay: 0.04 * Math.min(index, 8) },
  }),
};

export default function Skills() {
  const { ref } = useSectionInView("Skills");

  return (
    <section
      id="skills"
      ref={ref}
      tabIndex={-1}
      aria-label="Skills"
      className="mb-28 max-w-212 scroll-mt-28 text-center outline-none sm:mb-40"
    >
      <SectionHeading>My skills</SectionHeading>
      <ul className="flex flex-wrap justify-center gap-2 text-lg text-gray-800">
        {skillsData.map((skill, index) => (
          <m.li
            className="bg-white borderBlack rounded-xl px-5 py-3 dark:bg-white/10 dark:text-white/80"
            key={skill}
            variants={fadeInAnimationVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={index}
          >
            {skill}
          </m.li>
        ))}
      </ul>
    </section>
  );
}
