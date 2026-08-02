<script lang="ts">
  import BsArrowUp from "$lib/icons/BsArrowUp.svelte";
</script>

<!--
  Floating button (bottom-left, mirroring the bottom-right ThemeSwitch) that
  smooth-scrolls back to the top — worth having on a page this long.

  Ships in the markup with `hidden`, rather than being created when needed:
  src/lib/enhance/reveal.ts only clears the attribute once the visitor has
  scrolled past a viewport. If the enhancement bundle never runs, the button
  simply stays hidden, which is the correct outcome for a control whose only
  action requires JavaScript.
-->
<button
  type="button"
  data-scroll-top
  hidden
  aria-label="Scroll back to top"
  title="Back to top"
  class="focus-ring fixed bottom-6 left-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/80 shadow-2xl backdrop-blur-sm transition-all hover:scale-115 active:scale-105 dark:bg-gray-950"
>
  <BsArrowUp aria-hidden="true" />
</button>
