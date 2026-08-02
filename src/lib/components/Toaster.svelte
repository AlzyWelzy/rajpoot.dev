<!--
  The live region for contact-form results. Replaces react-hot-toast's
  <Toaster>, which was ~5KB for the two messages this site shows.

  Server-rendered and empty, rather than created on demand: a screen reader
  only announces changes to a region that was already in the accessibility
  tree when the change happened, so injecting the container and its first
  message together can go unannounced entirely. src/lib/enhance/toast.ts
  appends into it.
-->
<div
  data-toaster
  class="pointer-events-none fixed top-4 right-4 z-[1001] flex flex-col items-end gap-2"
  role="status"
  aria-live="polite"
  aria-atomic="false"
></div>
