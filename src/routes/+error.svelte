<script lang="ts">
  import { page } from "$app/state";

  const isNotFound = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{isNotFound ? "Page not found" : "Something went wrong"}</title>
  <!--
    Must be explicit: without it these pages inherit the layout's
    `index, follow`, which would invite an error page into the index.
  -->
  <meta name="robots" content="noindex, follow" />
</svelte:head>

<main
  id="main"
  tabindex="-1"
  class="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center outline-none"
>
  {#if isNotFound}
    <p
      class="text-sm font-semibold tracking-widest text-gray-500 uppercase dark:text-white/60"
    >
      404
    </p>
    <h1 class="mt-3 text-3xl font-bold sm:text-4xl">This page wandered off.</h1>
    <p class="mt-4 max-w-md text-gray-600 dark:text-white/70">
      The page you're looking for doesn't exist or may have moved. Let's get you
      back on track.
    </p>
    <a
      href="/"
      class="focus-ring group mt-8 inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-white outline-none transition hover:scale-110 hover:bg-gray-950 active:scale-105 dark:bg-white/10"
    >
      Back to home
    </a>
  {:else}
    <p
      class="text-sm font-semibold tracking-widest text-gray-500 uppercase dark:text-white/60"
    >
      Something broke
    </p>
    <h1 class="mt-3 text-3xl font-bold sm:text-4xl">This page hit an error.</h1>
    <p class="mt-4 max-w-md text-gray-600 dark:text-white/70">
      Sorry about that. You can try again, or head back to the homepage.
    </p>
    <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onclick={() => location.reload()}
        class="focus-ring group inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-white outline-none transition hover:scale-110 hover:bg-gray-950 active:scale-105 dark:bg-white/10"
      >
        Try again
      </button>
      <a
        href="/"
        class="focus-ring inline-flex items-center gap-2 rounded-full border border-black/15 px-7 py-3 font-medium text-gray-800 outline-none transition hover:scale-105 hover:bg-black/5 active:scale-100 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/10"
      >
        Back to home
      </a>
    </div>
  {/if}
</main>
