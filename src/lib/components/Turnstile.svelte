<script lang="ts">
  import { env } from "$env/dynamic/public";

  // Read at prerender time. With no key configured the container isn't
  // rendered at all, so src/lib/enhance/turnstile.ts finds nothing and stays
  // inert — which is what lets local development and the E2E suite run without
  // a live Cloudflare account.
  const siteKey = env.PUBLIC_TURNSTILE_SITE_KEY;
</script>

{#if siteKey}
  <!--
    The site key rides on the element rather than being baked into the
    enhancement bundle, because that bundle is content-hashed and shared across
    builds while the key is environment-specific.
  -->
  <div data-turnstile={siteKey} class="mt-3 flex justify-center"></div>
{/if}
