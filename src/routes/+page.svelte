<script lang="ts">
  import About from "$lib/components/About.svelte";
  import Contact from "$lib/components/Contact.svelte";
  import Experience from "$lib/components/Experience.svelte";
  import Intro from "$lib/components/Intro.svelte";
  import Projects from "$lib/components/Projects.svelte";
  import SectionDivider from "$lib/components/SectionDivider.svelte";
  import Skills from "$lib/components/Skills.svelte";
  import Testimonials from "$lib/components/Testimonials.svelte";

  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<main
  id="main"
  tabindex="-1"
  class="flex flex-col items-center px-4 outline-none"
>
  <Intro />
  <SectionDivider />
  <About />
  <Projects />
  <Skills />
  <Experience />
  <!--
    The testimonials section has its own vertical spacing and no surrounding
    divider, so hiding it cleanly restores the Experience → Contact flow
    without leaving a layout gap.
  -->
  {#if data.showTestimonials}
    <Testimonials />
  {/if}
  <Contact />
</main>
