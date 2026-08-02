<script lang="ts">
  import ExperienceTimeline from "./ExperienceTimeline.svelte";
  import SectionHeading from "./SectionHeading.svelte";
  import SectionSpy from "./SectionSpy.svelte";
</script>

<SectionSpy
  section="Experience"
  id="experience"
  label="Experience and education"
  class="mb-28 scroll-mt-28 outline-none sm:mb-40"
>
  <SectionHeading>My experience</SectionHeading>
  <ExperienceTimeline />
</SectionSpy>
