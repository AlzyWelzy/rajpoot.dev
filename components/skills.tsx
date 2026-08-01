import SectionHeading from "./section-heading";
import SectionSpy from "./section-spy";
import { skillsData } from "@/lib/data";

// Server component. The chips used to be 32 `m.li` elements driven by a motion
// stagger variant; the same reveal now comes from a CSS scroll-driven
// animation (`.chip-reveal` in globals.css), so a purely decorative effect
// costs no client JS at all. Browsers without `animation-timeline` just show
// the chips, which is the right fallback.
export default function Skills() {
  return (
    <SectionSpy
      section="Skills"
      id="skills"
      aria-label="Skills"
      className="mb-28 max-w-212 scroll-mt-28 text-center outline-none sm:mb-40"
    >
      <SectionHeading>My skills</SectionHeading>
      <ul className="flex flex-wrap justify-center gap-2 text-lg text-gray-800">
        {skillsData.map((skill) => (
          <li
            key={skill}
            className="chip-reveal bg-white borderBlack rounded-xl px-5 py-3 dark:bg-white/10 dark:text-white/80"
          >
            {skill}
          </li>
        ))}
      </ul>
    </SectionSpy>
  );
}
