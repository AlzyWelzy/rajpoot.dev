<script lang="ts">
  import type { Snippet } from "svelte";

  import type { SectionName } from "$lib/types";

  let {
    section,
    id,
    label,
    class: klass = "",
    animate = false,
    children,
  }: {
    /** Nav entry this section represents; drives the header's active pill. */
    section: SectionName;
    id: string;
    label: string;
    class?: string;
    /** Fade + rise the section the first time it scrolls into view. */
    animate?: boolean;
    children: Snippet;
  } = $props();
</script>

<!--
  Shared markup for a content section, and nothing else.

  In the React build this file existed to stop `"use client"` spreading: a
  section that wanted to observe itself had to become a client component,
  dragging all of its prose into the JS bundle. There is no bundle to drag it
  into now — the behaviour lives in src/lib/enhance/, found by the
  `data-section` and `data-reveal` attributes below.

  tabindex="-1" makes the section a programmatic focus target for the nav links
  and the skip link without putting it in the tab order.
-->
<section
  {id}
  aria-label={label}
  tabindex="-1"
  class={klass}
  data-section={section}
  data-reveal={animate ? "" : undefined}
  data-reveal-delay={animate ? "0.175" : undefined}
>
  {@render children()}
</section>
