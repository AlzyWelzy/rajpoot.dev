<script lang="ts">
  import { reveal } from "$lib/actions/reveal";
  import LuQuote from "$lib/icons/LuQuote.svelte";
  import type { TestimonialType } from "$lib/types";

  let {
    quote,
    author,
    title,
    source,
    sourceUrl,
    index = 0,
  }: TestimonialType & { index?: number } = $props();
</script>

<!-- One-shot reveal on enter, staggered per card (cheap; runs once). -->
<li
  data-reveal
  use:reveal={{ amount: 0.3, delay: index * 0.1 }}
  class="flex w-full flex-col rounded-2xl border border-black/5 bg-gray-100 p-6 text-left shadow-sm sm:max-w-md sm:p-7 dark:border-white/10 dark:bg-white/4"
>
  <LuQuote
    aria-hidden="true"
    class="mb-3 h-7 w-7 text-gray-400 dark:text-white/30"
  />
  <blockquote class="leading-relaxed text-gray-700 dark:text-white/80">
    &ldquo;{quote}&rdquo;
  </blockquote>
  <footer class="mt-5 flex items-center justify-between gap-3">
    <div>
      <p class="font-semibold">{author}</p>
      <p class="text-sm text-gray-600 dark:text-white/60">{title}</p>
    </div>
    {#if source}
      {#if sourceUrl}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="{source} (opens in a new tab)"
          class="focus-ring shrink-0 rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-gray-600 outline-none transition hover:bg-black/5 dark:border-white/15 dark:text-white/60 dark:hover:bg-white/10"
        >
          {source}
        </a>
      {:else}
        <span
          class="shrink-0 rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-gray-500 dark:border-white/15 dark:text-white/50"
        >
          {source}
        </span>
      {/if}
    {/if}
  </footer>
</li>
