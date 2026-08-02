<script lang="ts">
  import { projectsData } from "$lib/data";
  import Project from "./Project.svelte";
  import SectionHeading from "./SectionHeading.svelte";
  import SectionSpy from "./SectionSpy.svelte";
</script>

<SectionSpy
  section="Projects"
  id="projects"
  label="Projects"
  class="mb-28 w-full max-w-2xl scroll-mt-28 outline-none"
>
  <SectionHeading>My projects</SectionHeading>
  <div>
    {#each projectsData as project (project.title)}
      <Project {...project} />
    {/each}
  </div>
</SectionSpy>
