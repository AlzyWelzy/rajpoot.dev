import {
  activeSectionState,
  subscribeActiveSection,
  beginNavigation,
} from "@/lib/stores/active-section";
import type { SectionName } from "@/lib/types";

const list = document.getElementById("nav-list");

if (list) {
  const pill = list.querySelector<HTMLElement>('[data-testid="active-pill"]');
  const items = Array.from(
    list.querySelectorAll<HTMLElement>("[data-nav-item]"),
  );

  const ACTIVE_LINK = ["text-gray-950", "dark:text-white"];
  const IDLE_LINK = [
    "text-gray-600",
    "hover:text-gray-950",
    "dark:text-gray-300",
    "dark:hover:text-white",
    "hover:bg-black/5",
    "dark:hover:bg-white/6",
  ];

  // The pill used to be a motion `layoutId` shared-element animation, then
  // a Svelte-measured span. Same idea with no framework: measure the active
  // item and move one absolutely positioned span with a CSS transform.
  function measure() {
    if (!pill) return;
    const active = list!.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) {
      pill.style.opacity = "0";
      return;
    }
    // offsetLeft/Top are relative to the ul (the nearest positioned
    // ancestor), which is exactly the coordinate space the pill sits in.
    pill.style.transform = `translate3d(${active.offsetLeft}px, ${active.offsetTop}px, 0)`;
    pill.style.width = `${active.offsetWidth}px`;
    pill.style.height = `${active.offsetHeight}px`;
    pill.style.opacity = "1";
  }

  function render(name: SectionName) {
    for (const item of items) {
      const isActive = item.dataset.navItem === name;
      const link = item.querySelector("a");
      if (isActive) {
        item.dataset.active = "true";
        link?.setAttribute("aria-current", "page");
        link?.classList.remove(...IDLE_LINK);
        link?.classList.add(...ACTIVE_LINK);
      } else {
        delete item.dataset.active;
        link?.removeAttribute("aria-current");
        link?.classList.remove(...ACTIVE_LINK);
        link?.classList.add(...IDLE_LINK);
      }
    }
    measure();
  }

  for (const item of items) {
    item.querySelector("a")?.addEventListener("click", () => {
      const name = item.dataset.navItem as SectionName | undefined;
      if (!name) return;
      activeSectionState.value = name;
      beginNavigation();
    });
  }

  render(activeSectionState.value);
  subscribeActiveSection(render);

  // The nav wraps to two rows on narrow viewports, so the pill has to be
  // re-measured whenever the list's own box changes, not just on resize.
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(measure).observe(list);
  }
}
