<script lang="ts">
  import clsx from "clsx";
  import {
    activeSectionState,
    beginNavigation,
  } from "@/lib/stores/active-section.svelte";
  import type { SectionName } from "@/lib/types";

  type LinkItem = { name: SectionName; hash: string };
  let { links }: { links: readonly LinkItem[] } = $props();

  // The active pill used to be a motion `layoutId` shared-element animation.
  // Measuring the active item and moving one absolutely positioned span with
  // a CSS transform transition gives the same sliding pill with no animation
  // library at all.
  let listEl: HTMLUListElement | undefined = $state();
  let pill: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null = $state(null);

  function measure() {
    const list = listEl;
    if (!list) return;
    const active = list.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) {
      pill = null;
      return;
    }
    // offsetLeft/Top are relative to the ul (the nearest positioned
    // ancestor), which is exactly the coordinate space the pill sits in.
    pill = {
      left: active.offsetLeft,
      top: active.offsetTop,
      width: active.offsetWidth,
      height: active.offsetHeight,
    };
  }

  $effect(() => {
    // Read (not used) so this effect re-runs whenever the active section
    // changes elsewhere — e.g. the scroll-spy in BaseLayout.astro.
    void activeSectionState.value;
    measure();
  });

  $effect(() => {
    const list = listEl;
    if (!list || typeof ResizeObserver === "undefined") return;
    // The nav wraps to two rows on narrow viewports, so the pill has to be
    // re-measured whenever the list's own box changes, not just on resize.
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  });

  function onLinkClick(name: SectionName) {
    activeSectionState.value = name;
    beginNavigation();
  }
</script>

<!-- No role="banner": a <header> that isn't nested inside a sectioning
     element already exposes the banner landmark, so restating it is
     redundant. -->
<header class="z-999 relative">
  <nav
    aria-label="Primary"
    class="nav-drop-in fixed top-4 left-1/2 flex w-[min(100%-1.5rem,24rem)] items-center justify-center rounded-3xl border border-white/60 bg-white/80 shadow-lg shadow-black/5 ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150 sm:top-6 sm:w-xl sm:rounded-full dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/40 dark:ring-white/5"
  >
    <ul
      bind:this={listEl}
      class="relative flex min-h-13 flex-wrap items-center justify-center gap-x-1 gap-y-0.5 px-2 py-1.5 text-[0.85rem] font-medium sm:h-13 sm:min-h-[initial] sm:flex-nowrap sm:gap-0.5 sm:px-1.5 sm:py-0 sm:text-[0.9rem]"
    >
      <span
        aria-hidden="true"
        data-testid="active-pill"
        class="from-indigo-500/15 to-purple-500/15 pointer-events-none absolute left-0 top-0 -z-10 rounded-full bg-linear-to-r shadow-sm ring-1 ring-inset ring-black/5 transition-[transform,width,height,opacity] duration-300 ease-out motion-reduce:transition-none dark:from-indigo-400/15 dark:to-purple-400/15 dark:shadow-black/20 dark:ring-white/10"
        style={pill
          ? `transform: translate3d(${pill.left}px, ${pill.top}px, 0); width: ${pill.width}px; height: ${pill.height}px; opacity: 1;`
          : "opacity: 0;"}
      ></span>

      {#each links as link, i (link.hash)}
        <li
          class="nav-item-drop-in flex items-center justify-center relative"
          style={`animation-delay: ${0.15 + i * 0.05}s`}
          data-active={activeSectionState.value === link.name
            ? "true"
            : undefined}
        >
          <a
            class={clsx(
              "relative flex w-full items-center justify-center rounded-full px-2.5 py-2 text-gray-600 outline-none transition-colors duration-200 hover:text-gray-950 focus-visible:ring-2 focus-visible:ring-slate-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent sm:px-3.5 sm:py-2 dark:text-gray-300 dark:hover:text-white",
              {
                "text-gray-950 dark:text-white":
                  activeSectionState.value === link.name,
                "hover:bg-black/5 dark:hover:bg-white/6":
                  activeSectionState.value !== link.name,
              },
            )}
            href={link.hash}
            aria-current={activeSectionState.value === link.name
              ? "page"
              : undefined}
            onclick={() => onLinkClick(link.name)}
          >
            {link.name}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</header>
