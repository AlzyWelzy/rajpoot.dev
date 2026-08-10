#!/usr/bin/env node
/**
 * Pre-renders the images that used to be App Router `ImageResponse` routes
 * (scripts/og-image.tsx -> public/opengraph-image.png, scripts/apple-icon.tsx
 * -> public/apple-icon.png) at build time, once, instead of per request.
 *
 * Why: next/og's ImageResponse pulls in @vercel/og's WASM font renderer
 * (resvg + yoga, ~1.5MB uncompressed) into whatever bundle calls it. On
 * Cloudflare Workers that pushed the deployed script over the free plan's
 * 3MB size limit — for images whose content never actually varies per
 * request (both are static identity data / a fixed icon, not something a
 * visitor's request could change). Static files remove that dependency from
 * the Worker bundle entirely.
 *
 * This runs as plain Node (no Next.js build context), so the *.tsx sources
 * — which use the `@/*` alias and JSX — are bundled with esbuild first;
 * react and next/og.js are left external and resolved from node_modules as
 * usual.
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
  { entry: "scripts/og-image.tsx", output: "public/opengraph-image.png" },
  { entry: "scripts/apple-icon.tsx", output: "public/apple-icon.png" },
];

// Bundled under node_modules/.cache rather than the OS temp dir so Node's
// module resolution can still walk up to the project's node_modules for the
// externalized react / next/og.js imports.
const cacheDir = join(root, "node_modules/.cache");
mkdirSync(cacheDir, { recursive: true });
const tmpDir = mkdtempSync(join(cacheDir, "static-images-"));

try {
  const { createElement } = await import("react");
  const { ImageResponse } = await import("next/og.js");

  for (const { entry, output } of IMAGES) {
    const bundlePath = join(tmpDir, `${entry.replace(/\W/g, "_")}.mjs`);

    await esbuild.build({
      entryPoints: [join(root, entry)],
      outfile: bundlePath,
      bundle: true,
      format: "esm",
      platform: "node",
      jsx: "automatic",
      packages: "external",
      alias: { "@": root },
    });

    const { default: Component, size } = await import(
      pathToFileURL(bundlePath)
    );

    const response = new ImageResponse(createElement(Component), size);
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
