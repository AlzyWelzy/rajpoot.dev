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

    `min-height` reserves the widget's row before the script has loaded. Without
    it the Send button jumps down when Turnstile renders, which is a layout
    shift on the one part of the page a visitor is actively interacting with.
  -->
  <div
    data-turnstile={siteKey}
    class="mb-3 flex min-h-[65px] items-center justify-start"
  ></div>
{/if}
