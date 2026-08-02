<script lang="ts">
  import { links } from "$lib/data";

  // "Home" is active in the served HTML because it is the section the page
  // opens on. src/lib/enhance/nav.ts takes over from there.
  const INITIAL = "Home";
</script>

<!--
  No role="banner": a <header> that isn't nested inside a sectioning element
  already exposes the banner landmark, so restating it is redundant.
-->
<header class="relative z-[999]">
  <nav
    data-nav
    aria-label="Primary"
    class="nav-drop fixed top-4 left-1/2 flex w-[min(100%-1.5rem,24rem)] -translate-x-1/2 items-center justify-center rounded-3xl border border-white/60 bg-white/80 shadow-lg shadow-black/5 ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150 sm:top-6 sm:w-xl sm:rounded-full dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/40 dark:ring-white/5"
  >
    <ul
      data-nav-list
      class="relative flex min-h-13 flex-wrap items-center justify-center gap-x-1 gap-y-0.5 px-2 py-1.5 text-[0.85rem] font-medium sm:h-13 sm:min-h-[initial] sm:flex-nowrap sm:gap-0.5 sm:px-1.5 sm:py-0 sm:text-[0.9rem]"
    >
      <!--
        The sliding active pill. This was a motion `layoutId` shared-element
        animation, which was the single reason the whole app had to load
        motion's `domMax` feature bundle. It is now one absolutely positioned
        span that the enhancement script measures and moves with a CSS
        transform — same slide, no library, and now no framework either.

        It starts at opacity 0 and is positioned on first measure, so it is
        invisible rather than misplaced when scripts don't run.
      -->
      <span
        aria-hidden="true"
        data-nav-pill
        data-testid="active-pill"
        style="opacity: 0"
        class="pointer-events-none absolute top-0 left-0 -z-10 rounded-full bg-gray-100 shadow-sm ring-1 ring-black/5 ring-inset transition-[transform,width,height,opacity] duration-300 ease-out motion-reduce:transition-none dark:bg-slate-700/60 dark:shadow-black/20 dark:ring-white/10"
      ></span>

      {#each links as link (link.hash)}
        {@const active = link.name === INITIAL}
        <li
          class="nav-item relative flex items-center justify-center"
          data-nav-item={link.name}
          data-active={active ? "true" : undefined}
        >
          <a
            href={link.hash}
            aria-current={active ? "page" : undefined}
            class="nav-link relative flex w-full items-center justify-center rounded-full px-2.5 py-2 text-gray-600 outline-none transition-colors duration-200 hover:bg-black/5 hover:text-gray-950 focus-visible:ring-2 focus-visible:ring-slate-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent sm:px-3.5 sm:py-2 dark:text-gray-300 dark:hover:bg-white/6 dark:hover:text-white"
          >
            {link.name}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</header>
