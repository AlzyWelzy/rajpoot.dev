import SectionHeading from "./section-heading";
import ExperienceTimeline from "./experience-timeline";
import SectionSpy from "./section-spy";

// Server component: the timeline is static markup, so nothing below
// SectionSpy reaches the client bundle.
export default function Experience() {
  return (
    <SectionSpy
      section="Experience"
      id="experience"
      aria-label="Experience and education"
      className="scroll-mt-28 mb-28 outline-none sm:mb-40"
    >
      <SectionHeading>My experience</SectionHeading>
      <ExperienceTimeline />
    </SectionSpy>
  );
}
