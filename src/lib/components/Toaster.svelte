<script lang="ts">
  import { fly } from "svelte/transition";

  import { toast } from "$lib/state/toast.svelte";
</script>

<!--
  Replaces react-hot-toast's <Toaster>. `aria-live="polite"` on a persistent
  region is what actually announces the contact-form result to a screen reader;
  the visual toast is the sighted equivalent.
-->
<div
  class="pointer-events-none fixed top-4 right-4 z-[1001] flex flex-col items-end gap-2"
  role="status"
  aria-live="polite"
  aria-atomic="false"
>
  {#each toast.items as item (item.id)}
    <div
      in:fly={{ y: -8, duration: 250 }}
      out:fly={{ y: -8, duration: 200 }}
      class="pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-lg bg-white px-4 py-3 text-sm text-gray-900 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:text-white dark:ring-white/10"
    >
      {#if item.kind === "success"}
        <span
          aria-hidden="true"
          class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-xs text-white"
        >
          ✓
        </span>
      {:else}
        <span
          aria-hidden="true"
          class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs text-white"
        >
          !
        </span>
      {/if}
      <span>{item.message}</span>
    </div>
  {/each}
</div>
