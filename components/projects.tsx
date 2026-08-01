import SectionHeading from "./section-heading";
import Project from "./project";
import SectionSpy from "./section-spy";
import { projectsData } from "@/lib/data";

// Server component: project data is rendered here and only the individual
// cards (which animate on hover/enter) are client components.
export default function Projects() {
  return (
    <SectionSpy
      section="Projects"
      id="projects"
      aria-label="Projects"
      className="mb-28 w-full max-w-2xl scroll-mt-28 outline-none"
    >
      <SectionHeading>My projects</SectionHeading>
      <div>
        {projectsData.map((project) => (
          <Project key={project.title} {...project} />
        ))}
      </div>
    </SectionSpy>
  );
}
