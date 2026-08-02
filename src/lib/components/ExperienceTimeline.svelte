<script lang="ts">
  import { experiencesData } from "$lib/data";
</script>

<!--
  Hand-rolled vertical timeline (replaces react-vertical-timeline-component):
  a center line with alternating cards on desktop, a left rail with stacked
  cards on mobile. Static markup — no scroll listeners, no extra CSS bundle —
  themed via the --timeline-* variables in app.css.
-->
<ol class="relative mx-auto mt-12 max-w-185">
  <div
    aria-hidden="true"
    class="absolute top-0 left-5 h-full w-px bg-[color:var(--timeline-arrow)] opacity-40 sm:left-1/2 sm:-translate-x-1/2"
  ></div>
  {#each experiencesData as item, index (item.title)}
    {@const Icon = item.icon}
    <li class="relative mb-10 pl-14 last:mb-0 sm:pl-0">
      <span
        aria-hidden="true"
        class="absolute top-3 left-5 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-[color:var(--timeline-icon-bg)] text-[1.35rem] text-[color:var(--timeline-text)] ring-1 ring-black/5 sm:left-1/2"
      >
        <Icon />
      </span>
      <article
        class="rounded-lg border border-black/5 bg-[color:var(--timeline-bg)] px-8 py-5 text-left sm:w-[calc(50%-3.25rem)] {index %
          2 ===
        0
          ? 'sm:mr-auto'
          : 'sm:ml-auto'}"
      >
        <h3 class="font-semibold text-[color:var(--timeline-text)]">
          {item.title}
        </h3>
        <p class="mt-0 font-normal text-[color:var(--timeline-text)]">
          {item.location}
        </p>
        <p class="mt-1 font-normal text-[color:var(--timeline-muted)]">
          {item.description}
        </p>
        <p
          class="mt-3 text-sm font-medium tracking-wide text-[color:var(--timeline-muted)] uppercase"
        >
          {item.date}
        </p>
      </article>
    </li>
  {/each}
</ol>
