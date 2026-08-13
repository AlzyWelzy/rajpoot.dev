import type { SectionName } from "@/lib/types";

export const activeSectionState = $state<{ value: SectionName }>({
  value: "Home",
});

let navigating = false;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

/** True while a nav-click smooth-scroll is in flight. */
export function isNavigating() {
  return navigating;
}

/** Call on a nav click: suppresses the scroll-spy until the smooth scroll
 *  settles so the active pill doesn't stutter through passed sections. */
export function beginNavigation() {
  navigating = true;
  if (fallbackTimer) clearTimeout(fallbackTimer);
  // Fallback for browsers without `scrollend` (Safari): cap the suppression.
  fallbackTimer = setTimeout(() => {
    navigating = false;
  }, 1000);
}

if (typeof window !== "undefined") {
  window.addEventListener("scrollend", () => {
    navigating = false;
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  });
}
