import { activeSectionState, isNavigating } from "@/lib/stores/active-section";
import type { SectionName } from "@/lib/types";

const ROOT_MARGIN = "-25% 0px -55% 0px";

const sections = Array.from(
  document.querySelectorAll<HTMLElement>("section[id]"),
);

const observer = new IntersectionObserver(
  (entries) => {
    if (isNavigating()) return;
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const name = (entry.target as HTMLElement).dataset.sectionName as
          SectionName | undefined;
        if (name) activeSectionState.value = name;
      }
    }
  },
  { rootMargin: ROOT_MARGIN, threshold: 0 },
);

for (const section of sections) observer.observe(section);
