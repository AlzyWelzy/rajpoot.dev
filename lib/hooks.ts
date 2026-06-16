import { useActiveSectionContext } from "@/context/active-section-context";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import type { SectionName } from "./types";

// The fixed header is ~3.25rem tall and sits 6rem from the top on desktop, so a
// section should count as "active" once it crosses just below that band rather
// than when it fills most of the viewport. A negative top rootMargin shrinks the
// observer's viewport from the top to roughly the header line; the large
// negative bottom keeps only one section active at a time near the upper area.
const ROOT_MARGIN = "-25% 0px -55% 0px";

export function useSectionInView(sectionName: SectionName) {
  const { ref, inView } = useInView({
    rootMargin: ROOT_MARGIN,
    // A tiny threshold paired with the rootMargin band — tall sections that can
    // never fill most of the viewport still register reliably.
    threshold: 0,
  });
  const { setActiveSection, isNavigating } = useActiveSectionContext();

  useEffect(() => {
    // After a nav click we suppress the spy so the pill doesn't stutter through
    // every section a long smooth-scroll passes. Suppression ends the moment the
    // scroll actually finishes (`scrollend`), with a 1s fallback for browsers
    // without it — both handled in the active-section context.
    if (inView && !isNavigating()) {
      setActiveSection(sectionName);
    }
  }, [inView, setActiveSection, isNavigating, sectionName]);

  return { ref };
}
