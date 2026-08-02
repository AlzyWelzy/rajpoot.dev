<script lang="ts">
  import { fade, scale } from "svelte/transition";

  import BsArrowUp from "$lib/icons/BsArrowUp.svelte";

  /**
   * Floating button (bottom-left, mirroring the bottom-right ThemeSwitch) that
   * appears once the user has scrolled past ~one viewport and smooth-scrolls
   * back to the top — saving a long manual scroll on this single-page site.
   */
  let visible = $state(false);

  $effect(() => {
    const onScroll = () => {
      visible = window.scrollY > window.innerHeight;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  });
</script>

{#if visible}
  <button
    type="button"
    onclick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    aria-label="Scroll back to top"
    title="Back to top"
    in:scale={{ start: 0.6, duration: 200 }}
    out:fade={{ duration: 150 }}
    class="focus-ring fixed bottom-6 left-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/80 shadow-2xl backdrop-blur-sm transition-all hover:scale-115 active:scale-105 dark:bg-gray-950"
  >
    <BsArrowUp aria-hidden="true" />
  </button>
{/if}
