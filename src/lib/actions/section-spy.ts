import { activeSection } from "../state/active-section.svelte";
import type { SectionName } from "../types";

// The fixed header is ~3.25rem tall and sits 6rem from the top on desktop, so a
// section should count as "active" once it crosses just below that band rather
// than when it fills most of the viewport. A negative top rootMargin shrinks the
// observer's viewport from the top to roughly the header line; the large
// negative bottom keeps only one section active at a time near the upper area.
const ROOT_MARGIN = "-25% 0px -55% 0px";

/**
 * Marks `node` as the active nav target while it sits in the header band.
 *
 * Replaces the react-intersection-observer hook. Same observer geometry, but as
 * a Svelte action it attaches directly to the element instead of needing a
 * client-component wrapper around otherwise-static prose.
 */
export function sectionSpy(node: HTMLElement, section: SectionName) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        // After a nav click the spy is suppressed so the pill doesn't stutter
        // through every section a long smooth-scroll passes. Suppression ends
        // when the scroll actually finishes (`scrollend`), with a 1s fallback
        // for browsers without it — both handled in the active-section state.
        if (entry.isIntersecting && !activeSection.isNavigating()) {
          activeSection.set(section);
        }
      }
    },
    // A tiny threshold paired with the rootMargin band — tall sections that can
    // never fill most of the viewport still register reliably.
    { rootMargin: ROOT_MARGIN, threshold: 0 },
  );

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    },
  };
}
