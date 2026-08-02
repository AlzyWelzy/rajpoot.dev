/**
 * Scroll-spy and the header's sliding active pill.
 *
 * The pill was a motion `layoutId` shared-element animation in the React
 * build, which was the single reason the whole app had to load motion's
 * `domMax` bundle. Measuring the active item and moving one absolutely
 * positioned span with a CSS transform gives the same slide for no library at
 * all — and now for no framework either.
 */

// The fixed header is ~3.25rem tall and sits 6rem from the top on desktop, so a
// section counts as "active" once it crosses just below that band rather than
// when it fills the viewport. The negative top margin shrinks the observer's
// viewport to roughly the header line; the large negative bottom keeps only one
// section active at a time.
const ROOT_MARGIN = "-25% 0px -55% 0px";

// After a nav click the spy is suppressed so the pill doesn't stutter through
// every section a long smooth-scroll passes over. Suppression ends when the
// scroll actually finishes (`scrollend`), with a fallback for browsers without
// it (Safari) so a missed event can't freeze the pill for the session.
const NAVIGATION_FALLBACK_MS = 1000;

export function initNav() {
  const nav = document.querySelector<HTMLElement>("[data-nav]");
  const list = nav?.querySelector<HTMLElement>("[data-nav-list]");
  const pill = nav?.querySelector<HTMLElement>("[data-nav-pill]");
  const items = [
    ...(list?.querySelectorAll<HTMLElement>("[data-nav-item]") ?? []),
  ];

  let navigating = false;
  let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

  function beginNavigation() {
    navigating = true;
    clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(() => {
      navigating = false;
    }, NAVIGATION_FALLBACK_MS);
  }

  addEventListener("scrollend", () => {
    navigating = false;
    clearTimeout(fallbackTimer);
  });

  function measurePill() {
    if (!list || !pill) return;
    const active = list.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) {
      pill.style.opacity = "0";
      return;
    }
    // offsetLeft/Top are relative to the list (the nearest positioned
    // ancestor), which is exactly the coordinate space the pill sits in.
    pill.style.transform = `translate3d(${active.offsetLeft}px, ${active.offsetTop}px, 0)`;
    pill.style.width = `${active.offsetWidth}px`;
    pill.style.height = `${active.offsetHeight}px`;
    pill.style.opacity = "1";
  }

  function setActive(section: string) {
    for (const item of items) {
      const link = item.querySelector<HTMLElement>("a");
      const isActive = item.dataset.navItem === section;

      if (isActive) item.dataset.active = "true";
      else delete item.dataset.active;

      if (link) {
        if (isActive) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      }
    }
    measurePill();
  }

  for (const item of items) {
    item.querySelector("a")?.addEventListener("click", () => {
      setActive(item.dataset.navItem ?? "");
      beginNavigation();
    });
  }

  // The nav wraps to two rows on narrow viewports, so the pill has to be
  // re-measured whenever the list's own box changes, not just on window resize.
  if (list && typeof ResizeObserver !== "undefined") {
    new ResizeObserver(measurePill).observe(list);
  }

  const sections = document.querySelectorAll<HTMLElement>("[data-section]");
  if (sections.length && typeof IntersectionObserver !== "undefined") {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || navigating) continue;
          const section = (entry.target as HTMLElement).dataset.section;
          if (section) setActive(section);
        }
      },
      // A tiny threshold paired with the rootMargin band — tall sections that
      // can never fill most of the viewport still register reliably.
      { rootMargin: ROOT_MARGIN, threshold: 0 },
    );
    for (const section of sections) observer.observe(section);
  }

  measurePill();
}
