import type { SectionName } from "../types";

class ActiveSectionState {
  current = $state<SectionName>("Home");

  // Plain fields, not $state: nothing renders from them, and a reactive read
  // inside the IntersectionObserver callback would be a needless invalidation.
  #navigating = false;
  #fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  set(section: SectionName) {
    this.current = section;
  }

  isNavigating() {
    return this.#navigating;
  }

  /**
   * Call on a nav click: suppresses the scroll-spy until the smooth scroll
   * settles, so the active pill doesn't stutter through every section a long
   * scroll passes over.
   */
  beginNavigation() {
    this.#navigating = true;
    if (this.#fallbackTimer) clearTimeout(this.#fallbackTimer);
    // Fallback for browsers without `scrollend` (Safari): cap the suppression.
    this.#fallbackTimer = setTimeout(() => {
      this.#navigating = false;
    }, 1000);
  }

  /** Wires `scrollend`; returns a teardown for `$effect`. */
  listen(): () => void {
    const onScrollEnd = () => {
      this.#navigating = false;
      if (this.#fallbackTimer) {
        clearTimeout(this.#fallbackTimer);
        this.#fallbackTimer = null;
      }
    };

    window.addEventListener("scrollend", onScrollEnd);
    return () => {
      window.removeEventListener("scrollend", onScrollEnd);
      if (this.#fallbackTimer) clearTimeout(this.#fallbackTimer);
    };
  }
}

export const activeSection = new ActiveSectionState();
