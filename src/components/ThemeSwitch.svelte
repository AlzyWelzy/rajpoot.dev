<script lang="ts">
  import { themeState, toggleTheme } from "@/lib/stores/theme.svelte";
</script>

<button
  type="button"
  onclick={toggleTheme}
  aria-label={`Switch to ${themeState.value === "light" ? "dark" : "light"} mode`}
  aria-pressed={themeState.value === "dark"}
  title={`Switch to ${themeState.value === "light" ? "dark" : "light"} mode`}
  class="fixed bottom-6 right-5 z-50 bg-white/80 w-12 h-12 backdrop-blur-sm border border-white/40 shadow-2xl rounded-full flex items-center justify-center hover:scale-115 active:scale-105 transition-all focus-ring dark:bg-gray-950"
>
  <!-- Stacked icons crossfade + rotate on swap so the most-watched part of
       the interaction has motion. Neutralized by reduced-motion. -->
  <span class="relative block h-4.5 w-4.5" aria-hidden="true">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={`absolute inset-0 transition-[opacity,transform] duration-300 ${
        themeState.value === "light"
          ? "rotate-0 scale-100 opacity-100"
          : "-rotate-90 scale-50 opacity-0"
      }`}
    >
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
      />
    </svg>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={`absolute inset-0 transition-[opacity,transform] duration-300 ${
        themeState.value === "dark"
          ? "rotate-0 scale-100 opacity-100"
          : "rotate-90 scale-50 opacity-0"
      }`}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </span>
</button>
