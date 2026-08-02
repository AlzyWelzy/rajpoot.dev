<script lang="ts">
  import { testimonialsData } from "$lib/data";
  import LuQuote from "$lib/icons/LuQuote.svelte";
  import SectionHeading from "./SectionHeading.svelte";
  import Testimonial from "./Testimonial.svelte";

  // Renders nothing until there's at least one real endorsement — no empty
  // heading, no placeholder cards.
  const first = testimonialsData[0];
</script>

{#if first}
  <section
    id="testimonials"
    aria-label="Testimonials"
    class="mb-28 w-full max-w-4xl scroll-mt-28 sm:mb-40"
  >
    <SectionHeading>What people say</SectionHeading>

    <!--
      A single endorsement reads as sparse in a card grid, so feature it as one
      prominent centered quote. Two or more switch to the card grid.
    -->
    {#if testimonialsData.length === 1}
      <figure
        data-reveal
        data-reveal-amount="0.3"
        class="mx-auto max-w-2xl rounded-3xl border border-black/5 bg-gray-100 px-6 py-10 text-center shadow-sm sm:px-12 sm:py-12 dark:border-white/10 dark:bg-white/4"
      >
        <LuQuote
          aria-hidden="true"
          class="mx-auto mb-5 h-9 w-9 text-gray-300 dark:text-white/25"
        />
        <blockquote
          class="text-lg leading-relaxed text-gray-800 sm:text-xl sm:leading-relaxed dark:text-white/85"
        >
          &ldquo;{first.quote}&rdquo;
        </blockquote>
        <figcaption class="mt-6 flex flex-col items-center gap-1">
          <span class="font-semibold">{first.author}</span>
          <span class="text-sm text-gray-600 dark:text-white/60"
            >{first.title}</span
          >
          {#if first.source}
            {#if first.sourceUrl}
              <a
                href={first.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="{first.source} (opens in a new tab)"
                class="focus-ring mt-2 rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-gray-600 outline-none transition hover:bg-black/5 dark:border-white/15 dark:text-white/60 dark:hover:bg-white/10"
              >
                {first.source}
              </a>
            {:else}
              <span
                class="mt-2 rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-gray-500 dark:border-white/15 dark:text-white/50"
              >
                {first.source}
              </span>
            {/if}
          {/if}
        </figcaption>
      </figure>
    {:else}
      <ul class="mx-auto flex max-w-3xl flex-wrap justify-center gap-6">
        {#each testimonialsData as testimonial, i (`${testimonial.author}-${i}`)}
          <Testimonial index={i} {...testimonial} />
        {/each}
      </ul>
    {/if}
  </section>
{/if}
