"use client";

import React from "react";
import { motion } from "motion/react";

import SectionHeading from "./section-heading";
import { useSectionInView } from "@/lib/hooks";

export default function About() {
  const { ref } = useSectionInView("About");

  return (
    <motion.section
      ref={ref}
      id="about"
      aria-label="About me"
      className="mb-28 max-w-[45rem] text-center leading-8 sm:mb-40 scroll-mt-28"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.175 }}
    >
      <SectionHeading>About me</SectionHeading>
      <p className="mb-3">
        After completing my 12th grade with a specialization in{" "}
        <span className="font-medium">PCM</span>, I followed my passion for
        programming by pursuing a Computer Science degree, where I honed my
        skills in{" "}
        <span className="font-medium">full-stack web development</span>.{" "}
        <span className="italic">My favorite part of programming</span> is the
        problem-solving aspect. I <span className="underline">love</span> the
        feeling of finally figuring out a solution to a problem. My core stack
        is{" "}
        <span className="font-medium">Python, Django and PostgreSQL</span>. I am
        also familiar with HTMX and HyperScript. I am always looking to learn
        new technologies. I am currently looking for a{" "}
        <span className="font-medium">full-time position</span> as a software
        developer.
      </p>

      <p>
        <span className="italic">When I&apos;m not coding</span>, I enjoy playing
        video games, watching movies, and reading comics. I also enjoy{" "}
        <span className="font-medium">learning new things</span>. I am currently
        learning about <span className="font-medium">finance and history</span>.
        I&apos;m also learning how to swim.
      </p>
    </motion.section>
  );
}
