<script lang="ts">
  import { skillsData } from "$lib/data";
  import SectionHeading from "./SectionHeading.svelte";
  import SectionSpy from "./SectionSpy.svelte";
</script>

<!--
  The chips were 32 `m.li` elements driven by a motion stagger variant; the
  reveal is a CSS scroll-driven animation (`.chip-reveal` in app.css), so a
  purely decorative effect costs no client JS at all. Browsers without
  `animation-timeline` just show the chips, which is the right fallback.
-->
<SectionSpy
  section="Skills"
  id="skills"
  label="Skills"
  class="mb-28 max-w-212 scroll-mt-28 text-center outline-none sm:mb-40"
>
  <SectionHeading>My skills</SectionHeading>
  <ul class="flex flex-wrap justify-center gap-2 text-lg text-gray-800">
    {#each skillsData as skill (skill)}
      <li
        class="chip-reveal borderBlack rounded-xl bg-white px-5 py-3 dark:bg-white/10 dark:text-white/80"
      >
        {skill}
      </li>
    {/each}
  </ul>
</SectionSpy>
