<script lang="ts">
  import FaPaperPlane from "$lib/icons/FaPaperPlane.svelte";
</script>

<!--
  Both states ship in the markup and src/lib/enhance/contact.ts swaps the
  `hidden` attributes and the label text. Rendering the idle state and letting
  the script build the pending one would mean the button briefly has no
  content on slow connections.

  aria-busy + aria-label announce the state to assistive tech; the visible
  "Sending" + spinner keep the button from looking emptied out.
-->
<button
  type="submit"
  aria-label="Send message"
  aria-busy="false"
  class="focus-ring group flex h-12 w-32 items-center justify-center gap-2 rounded-full bg-gray-900 text-white outline-none transition-all hover:scale-110 hover:bg-gray-950 active:scale-105 disabled:scale-100 disabled:bg-gray-900/65 dark:bg-white/10"
>
  <span
    data-submit-spinner
    hidden
    aria-hidden="true"
    class="h-4 w-4 animate-spin rounded-full border-b-2 border-white"
  ></span>
  <span data-submit-label>Send</span>
  <span data-submit-icon>
    <FaPaperPlane
      aria-hidden="true"
      class="text-xs opacity-70 transition-all group-hover:-translate-y-1 group-hover:translate-x-1"
    />
  </span>
</button>
