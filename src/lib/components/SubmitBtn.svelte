<script lang="ts">
  import FaPaperPlane from "$lib/icons/FaPaperPlane.svelte";

  let { pending = false }: { pending?: boolean } = $props();
</script>

<button
  type="submit"
  disabled={pending}
  aria-label={pending ? "Sending message…" : "Send message"}
  aria-busy={pending}
  class="focus-ring group flex h-12 w-32 items-center justify-center gap-2 rounded-full bg-gray-900 text-white outline-none transition-all hover:scale-110 hover:bg-gray-950 active:scale-105 disabled:scale-100 disabled:bg-gray-900/65 dark:bg-white/10"
>
  {#if pending}
    <!--
      aria-busy + aria-label already announce the state to AT; the visible
      "Sending" + spinner keep the button from looking emptied out.
    -->
    <span
      aria-hidden="true"
      class="h-4 w-4 animate-spin rounded-full border-b-2 border-white"
    ></span>
    Sending
  {:else}
    Send
    <FaPaperPlane
      aria-hidden="true"
      class="text-xs opacity-70 transition-all group-hover:-translate-y-1 group-hover:translate-x-1"
    />
  {/if}
</button>
