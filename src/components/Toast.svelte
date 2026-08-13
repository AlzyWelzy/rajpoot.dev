<script lang="ts">
  import { fly, fade } from "svelte/transition";
  import { toastState, dismissToast } from "@/lib/stores/toast.svelte";
</script>

<div
  aria-live="polite"
  aria-atomic="true"
  class="pointer-events-none fixed top-4 right-4 z-1000 flex w-[min(100%-2rem,22rem)] flex-col gap-2"
>
  {#each toastState.items as item (item.id)}
    <div
      role="status"
      in:fly={{ y: -16, duration: 200 }}
      out:fade={{ duration: 150 }}
      class={`pointer-events-auto flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${
        item.type === "success"
          ? "border-green-600/20 bg-green-50/95 text-green-800 dark:border-green-400/25 dark:bg-green-950/90 dark:text-green-300"
          : "border-red-600/20 bg-red-50/95 text-red-800 dark:border-red-400/25 dark:bg-red-950/90 dark:text-red-300"
      }`}
    >
      <span class="flex-1">{item.message}</span>
      <button
        type="button"
        onclick={() => dismissToast(item.id)}
        aria-label="Dismiss notification"
        class="shrink-0 opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  {/each}
</div>
