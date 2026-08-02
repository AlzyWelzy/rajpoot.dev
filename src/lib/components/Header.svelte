<script lang="ts">
  import { links } from "$lib/data";
  import { activeSection } from "$lib/state/active-section.svelte";

  type PillBox = { left: number; top: number; width: number; height: number };

  // The active pill was a motion `layoutId` shared-element animation, which was
  // the single reason the whole app had to load motion's `domMax` feature
  // bundle. Measuring the active item and moving one absolutely positioned span
  // with a CSS transform gives the same sliding pill for no library at all.
  let list = $state<HTMLUListElement | null>(null);
  let pill = $state<PillBox | null>(null);

  function measure() {
    if (!list) return;
    const active = list.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) {
      pill = null;
      return;
    }
    // offsetLeft/Top are relative to the ul (the nearest positioned ancestor),
    // which is exactly the coordinate space the pill is placed in.
    pill = {
      left: active.offsetLeft,
      top: active.offsetTop,
      width: active.offsetWidth,
      height: active.offsetHeight,
    };
  }

  // Re-measure whenever the active item changes...
  $effect(() => {
    void activeSection.current;
    measure();
  });

  // ...and whenever the list's own box changes. The nav wraps to two rows on
  // narrow viewports, so a plain resize listener would miss the reflow.
  $effect(() => {
    if (!list || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  });

  const pillStyle = $derived(
    pill
      ? `transform: translate3d(${pill.left}px, ${pill.top}px, 0); width: ${pill.width}px; height: ${pill.height}px; opacity: 1;`
      : "opacity: 0;",
  );
</script>

<!--
  No role="banner": a <header> that isn't nested inside a sectioning element
  already exposes the banner landmark, so restating it is redundant.
-->
<header class="relative z-[999]">
  <nav
    aria-label="Primary"
    class="nav-drop fixed top-4 left-1/2 flex w-[min(100%-1.5rem,24rem)] -translate-x-1/2 items-center justify-center rounded-3xl border border-white/60 bg-white/80 shadow-lg shadow-black/5 ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150 sm:top-6 sm:w-xl sm:rounded-full dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/40 dark:ring-white/5"
  >
    <ul
      bind:this={list}
      class="relative flex min-h-13 flex-wrap items-center justify-center gap-x-1 gap-y-0.5 px-2 py-1.5 text-[0.85rem] font-medium sm:h-13 sm:min-h-[initial] sm:flex-nowrap sm:gap-0.5 sm:px-1.5 sm:py-0 sm:text-[0.9rem]"
    >
      <span
        aria-hidden="true"
        data-testid="active-pill"
        class="pointer-events-none absolute top-0 left-0 -z-10 rounded-full bg-gray-100 shadow-sm ring-1 ring-black/5 ring-inset transition-[transform,width,height,opacity] duration-300 ease-out motion-reduce:transition-none dark:bg-slate-700/60 dark:shadow-black/20 dark:ring-white/10"
        style={pillStyle}
      ></span>

      {#each links as link, i (link.hash)}
        <li
          class="nav-item relative flex items-center justify-center"
          data-active={activeSection.current === link.name ? "true" : undefined}
          style="animation-delay: {0.15 + i * 0.05}s"
        >
          <a
            href={link.hash}
            aria-current={activeSection.current === link.name
              ? "page"
              : undefined}
            class="relative flex w-full items-center justify-center rounded-full px-2.5 py-2 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-slate-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent sm:px-3.5 sm:py-2 {activeSection.current ===
            link.name
              ? 'text-gray-950 dark:text-white'
              : 'text-gray-600 hover:bg-black/5 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/6 dark:hover:text-white'}"
            onclick={() => {
              activeSection.set(link.name);
              activeSection.beginNavigation();
            }}
          >
            {link.name}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</header>
