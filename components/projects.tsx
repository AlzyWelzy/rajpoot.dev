"use client";

import React from "react";

import SectionHeading from "./section-heading";
import Project from "./project";
import { projectsData } from "@/lib/data";
import { useSectionInView } from "@/lib/hooks";

export default function Projects() {
  // Lower threshold: the taller banner cards make the section much taller than
  // the viewport, so a high ratio can never be intersecting.
  const { ref } = useSectionInView("Projects", 0.2);

  return (
    <section
      ref={ref}
      id="projects"
      tabIndex={-1}
      aria-label="Projects"
      className="mb-28 w-full max-w-2xl scroll-mt-28 outline-none"
    >
      <SectionHeading>My projects</SectionHeading>
      <div>
        {projectsData.map((project) => (
          <React.Fragment key={project.title}>
            <Project {...project} />
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
