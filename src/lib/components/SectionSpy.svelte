<script lang="ts">
  import type { Snippet } from "svelte";

  import { reveal } from "$lib/actions/reveal";
  import { sectionSpy } from "$lib/actions/section-spy";
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
  In the React build this file existed to stop `"use client"` from spreading:
  a section that wanted to observe itself had to become a client component,
  dragging all of its prose into the JS bundle, so the ref lived in a thin
  wrapper instead. Svelte has no such split — actions attach behaviour to
  server-rendered markup directly — so this is now just shared markup, and the
  prose inside never reaches the bundle either way.

  tabindex="-1" makes the section a programmatic focus target for the nav links
  and the skip link without putting it in the tab order.
-->
<section
  {id}
  aria-label={label}
  tabindex="-1"
  class={klass}
  data-reveal={animate ? "" : undefined}
  use:sectionSpy={section}
  use:reveal={{ enabled: animate, amount: 0.2, delay: 0.175 }}
>
  {@render children()}
</section>
