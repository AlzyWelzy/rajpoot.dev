// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import svelte from "@astrojs/svelte";
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
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
});
