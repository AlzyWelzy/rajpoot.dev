<script lang="ts">
  import BsMoon from "$lib/icons/BsMoon.svelte";
  import BsSun from "$lib/icons/BsSun.svelte";
</script>

<!--
  Static markup; src/lib/enhance/theme.ts attaches the click handler and keeps
  the accessible name and `aria-pressed` in step with the theme.

  The rendered label describes the *light* state because that is what
  app.html's pre-paint script assumes before it reads storage. A dark-mode
  visitor therefore sees a momentarily stale label, until the deferred
  enhancement bundle runs and calls `paint()` — a same-origin, immutably cached
  ~2KB module, so the window is negligible. The alternative is a
  state-independent name like "Toggle dark mode", which never goes stale but
  also never tells the visitor what the click will do.
-->
<button
  type="button"
  data-theme-toggle
  aria-label="Switch to dark mode"
  aria-pressed="false"
  title="Switch to dark mode"
  class="focus-ring fixed right-5 bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/80 shadow-2xl backdrop-blur-sm transition-all hover:scale-115 active:scale-105 dark:bg-gray-950"
>
  <!--
    Both icons ship; which one shows is driven entirely by `html.dark` in CSS
    (see app.css). That was reactive state in the Svelte version — as CSS it
    costs no JavaScript and, more usefully, cannot flash the wrong icon on
    load, because the theme class is already on <html> before first paint.
  -->
  <span class="relative block h-[1em] w-[1em]" aria-hidden="true">
    <BsSun
      class="theme-icon theme-icon-sun absolute inset-0 transition-[opacity,transform] duration-300"
    />
    <BsMoon
      class="theme-icon theme-icon-moon absolute inset-0 transition-[opacity,transform] duration-300"
    />
  </span>
</button>
