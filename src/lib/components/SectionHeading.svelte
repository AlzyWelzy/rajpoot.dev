<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<h2 class="mb-8 text-center text-3xl font-medium capitalize">
  {@render children()}
</h2>
