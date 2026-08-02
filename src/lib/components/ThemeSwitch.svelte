<script lang="ts">
  import BsMoon from "$lib/icons/BsMoon.svelte";
  import BsSun from "$lib/icons/BsSun.svelte";
  import { theme } from "$lib/state/theme.svelte";

  const label = $derived(
    `Switch to ${theme.current === "light" ? "dark" : "light"} mode`,
  );
</script>

<button
  type="button"
  onclick={() => theme.toggle()}
  aria-label={label}
  aria-pressed={theme.current === "dark"}
  title={label}
  class="focus-ring fixed right-5 bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/80 shadow-2xl backdrop-blur-sm transition-all hover:scale-115 active:scale-105 dark:bg-gray-950"
>
  <!--
    Stacked icons crossfade + rotate on swap so the most-watched part of the
    interaction has motion. Neutralized by reduced-motion.
  -->
  <span class="relative block h-[1em] w-[1em]" aria-hidden="true">
    <BsSun
      class="absolute inset-0 transition-[opacity,transform] duration-300 {theme.current ===
      'light'
        ? 'rotate-0 scale-100 opacity-100'
        : '-rotate-90 scale-50 opacity-0'}"
    />
    <BsMoon
      class="absolute inset-0 transition-[opacity,transform] duration-300 {theme.current ===
      'dark'
        ? 'rotate-0 scale-100 opacity-100'
        : 'rotate-90 scale-50 opacity-0'}"
    />
  </span>
</button>
