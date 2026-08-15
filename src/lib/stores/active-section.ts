import type { SectionName } from "@/lib/types";

// Plain observable rather than a framework store: the only consumers are the
// scroll-spy (a <script> in BaseLayout.astro) and the header's active pill,
// so a Set of callbacks is the whole requirement. Exported as an object with
// a `value` accessor — not a bare `let` — because ESM live bindings can't be
// written through from an importing module.
let active: SectionName = "Home";
const subscribers = new Set<(value: SectionName) => void>();

export const activeSectionState = {
  get value(): SectionName {
    return active;
  },
  set value(next: SectionName) {
    if (active === next) return;
    active = next;
    for (const fn of subscribers) fn(active);
  },
};

/** Fires on every change. Returns an unsubscribe function. */
export function subscribeActiveSection(fn: (value: SectionName) => void) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

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
