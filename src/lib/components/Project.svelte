<script lang="ts">
  import LuCode from "$lib/icons/LuCode.svelte";
  import LuExternalLink from "$lib/icons/LuExternalLink.svelte";
  import LuGithub from "$lib/icons/LuGithub.svelte";
  import type { ProjectType } from "$lib/types";

  let {
    title,
    description,
    tags,
    logo,
    liveUrl,
    liveLabel = "Live",
    githubUrl,
  }: ProjectType = $props();
</script>

<!--
  One-shot reveal on enter (cheap, runs once) instead of a per-card scroll
  tracker — no continuous scroll listeners or layout reads. The hover lift is a
  CSS transform on the card itself; in the React version it had to be a motion
  `whileHover` so it wouldn't fight the inline transform motion was already
  managing, which is no longer a concern.
-->
<article
  data-reveal
  data-reveal-amount="0.3"
  class="group mb-6 overflow-hidden rounded-2xl border border-black/5 bg-gray-100 shadow-sm transition last:mb-0 hover:-translate-y-1 hover:shadow-md dark:border-white/10 dark:bg-white/4"
>
  <div
    class="relative aspect-video w-full overflow-hidden border-b border-black/5 bg-linear-to-br from-[#241659] to-[#0b1020] dark:border-white/10"
  >
    {#if logo}
      <div class="flex h-full w-full items-center justify-center">
        <img
          src={logo}
          alt="{title} logo"
          width="120"
          height="120"
          loading="lazy"
          decoding="async"
          class="h-28 w-28 drop-shadow-xl transition duration-500 group-hover:scale-110"
        />
      </div>
    {:else}
      <div
        aria-hidden="true"
        class="flex h-full w-full items-center justify-center"
      >
        <LuCode
          class="text-white/80 transition duration-500 group-hover:scale-110"
          size={72}
        />
      </div>
    {/if}
  </div>

  <div class="p-6 sm:p-7">
    <h3 class="text-2xl font-semibold">{title}</h3>
    <p class="mt-2 leading-relaxed text-gray-700 dark:text-white/70">
      {description}
    </p>

    <ul
      class="mt-4 flex flex-wrap gap-2"
      aria-label="Technologies used in {title}"
    >
      {#each tags as tag (tag)}
        <li
          class="rounded-full bg-black/70 px-3 py-1 text-[0.7rem] tracking-wider text-white uppercase dark:bg-white/10 dark:text-white/70"
        >
          {tag}
        </li>
      {/each}
    </ul>

    {#if liveUrl || githubUrl}
      <div class="mt-5 flex flex-wrap gap-2.5">
        {#if liveUrl}
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-track="project_click"
            data-track-props={JSON.stringify({
              project: title,
              target: "live",
            })}
            aria-label="Open {title} — {liveLabel} (opens in a new tab)"
            class="focus-ring inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white outline-none transition hover:scale-105 hover:bg-gray-950 active:scale-100 dark:bg-white/15 dark:hover:bg-white/25"
          >
            <LuExternalLink aria-hidden="true" />
            {liveLabel}
          </a>
        {/if}
        {#if githubUrl}
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-track="project_click"
            data-track-props={JSON.stringify({
              project: title,
              target: "github",
            })}
            aria-label="View {title} source code on GitHub (opens in a new tab)"
            class="focus-ring inline-flex items-center gap-1.5 rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-gray-800 outline-none transition hover:scale-105 hover:bg-black/5 active:scale-100 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/10"
          >
            <LuGithub aria-hidden="true" />
            Code
          </a>
        {/if}
      </div>
    {/if}
  </div>
</article>
