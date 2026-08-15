// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  adapter: cloudflare({
    // This site has no images that need Cloudflare's on-the-fly resizing
    // (the one avatar ships pre-optimized as a static WebP) — passthrough
    // skips enabling the paid Images binding entirely.
    imageService: "passthrough",
  }),
  // No server-side session state anywhere on this site — skip the adapter's
  // default KV session binding.
  session: false,
  build: {
    // The stylesheet was a render-blocking request that only started at
    // ~380ms (it can't be discovered before the HTML arrives) and took
    // another ~150ms. Inlining it removes that round trip entirely, and
    // because the CSS compresses far better as part of the document than as
    // a standalone file, the total bytes on the wire go *down* as well.
    //
    // The trade-off is that the CSS is no longer immutable-cached across
    // visits — but this is a one-page site whose HTML is already
    // `must-revalidate`, so a repeat visitor was refetching the document
    // regardless. First-render latency is the metric that matters here.
    inlineStylesheets: "always",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
