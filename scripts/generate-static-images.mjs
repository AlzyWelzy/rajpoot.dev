#!/usr/bin/env node
/**
 * Pre-renders the images that would otherwise need a per-request
 * ImageResponse route (scripts/og-image.mjs -> public/opengraph-image.png,
 * scripts/apple-icon.mjs -> public/apple-icon.png) at build time, once,
 * instead of per request.
 *
 * Why: @vercel/og's ImageResponse pulls in a WASM font renderer (resvg +
 * yoga, ~1.5MB uncompressed) into whatever bundle calls it. On Cloudflare
 * Workers that pushes a deployed script over the free plan's 3MB size limit
 * — for images whose content never actually varies per request (both are
 * static identity data / a fixed icon, not something a visitor's request
 * could change). Static files remove that dependency from the Worker bundle
 * entirely.
 *
 * This runs as plain Node (no Vite/Astro build context), so the *.mjs
 * sources — which use the `@/*` alias and plain object trees, no JSX/React
 * — are bundled with esbuild first. `import.meta.env.PUBLIC_*` reads inside
 * lib/seo.ts only exist as Vite build-time replacements normally; `define`
 * below shims the same two keys for this standalone esbuild pass so the
 * site's real siteConfig can be imported unchanged.
 *
 * Run manually with `pnpm generate:images` after changing either source and
 * commit the result — this mirrors how scripts/sync-build-meta.mjs's
 * outputs are generated-but-committed rather than regenerated on every
 * build.
 */
import { writeFileSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const IMAGES = [
  { entry: "scripts/og-image.mjs", output: "public/opengraph-image.png" },
  { entry: "scripts/apple-icon.mjs", output: "public/apple-icon.png" },
];

// Bundled under node_modules/.cache rather than the OS temp dir so Node's
// module resolution can still walk up to the project's node_modules for the
// externalized @vercel/og import.
const cacheDir = join(root, "node_modules/.cache");
mkdirSync(cacheDir, { recursive: true });
const tmpDir = mkdtempSync(join(cacheDir, "static-images-"));

try {
  const { ImageResponse } = await import("@vercel/og");

  for (const { entry, output } of IMAGES) {
    const bundlePath = join(tmpDir, `${entry.replace(/\W/g, "_")}.mjs`);

    await esbuild.build({
      entryPoints: [join(root, entry)],
      outfile: bundlePath,
      bundle: true,
      format: "esm",
      platform: "node",
      packages: "external",
      alias: { "@": join(root, "src") },
      define: {
        "import.meta.env.PUBLIC_SITE_URL": JSON.stringify(
          process.env.PUBLIC_SITE_URL ?? "",
        ),
        "import.meta.env.PUBLIC_TURNSTILE_SITE_KEY": JSON.stringify(
          process.env.PUBLIC_TURNSTILE_SITE_KEY ?? "",
        ),
      },
    });

    const { default: buildTree, size } = await import(
      pathToFileURL(bundlePath)
    );

    const response = new ImageResponse(buildTree(), size);
    const buffer = Buffer.from(await response.arrayBuffer());
    const outputPath = join(root, output);
    writeFileSync(outputPath, buffer);
    console.log(
      `[generate-static-images] wrote ${output} (${buffer.length} bytes)`,
    );
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
