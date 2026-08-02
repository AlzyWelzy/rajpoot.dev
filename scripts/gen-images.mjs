#!/usr/bin/env node
/**
 * Generates every raster asset the site serves, at build time.
 *
 * On Vercel these were three runtime/edge concerns: next/image resized the
 * avatar on demand, and `app/opengraph-image.tsx` + `app/apple-icon.tsx` were
 * ImageResponse routes. None of them were ever per-request — the inputs are
 * committed files and constants — so all three are now plain build outputs,
 * which is both faster to serve (a static file off the edge) and one less thing
 * that can fail in production.
 *
 * Outputs (all into static/, all gitignored):
 *   profile-{96,192,288}.{avif,webp,jpg}   hero avatar DPR ladder
 *   opengraph-image.png                    1200x630 social card
 *   apple-icon.png                         180x180 touch icon
 *
 * Everything is skipped when the output is newer than its inputs, so a rebuild
 * that changed no image costs nothing.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import subsetFont from "subset-font";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATIC = join(root, "static");

// Kept in sync with src/lib/seo.ts by hand — this script runs before the
// TypeScript build, so it cannot import it. Only the fields the card renders.
const seo = readFileSync(join(root, "src/lib/seo.ts"), "utf8");
const field = (name) => {
  const m = seo.match(new RegExp(`\\b${name}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  if (!m)
    throw new Error(`gen-images: could not read ${name} from src/lib/seo.ts`);
  return m[1];
};
const listField = (name) => {
  const m = seo.match(new RegExp(`\\b${name}:\\s*\\[([^\\]]*)\\]`, "s"));
  if (!m)
    throw new Error(`gen-images: could not read ${name} from src/lib/seo.ts`);
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
};

const NAME = field("name");
const ROLELINE = field("roleline");
const OG_TAGS = listField("ogTags");

const fontDir = join(root, "node_modules/@fontsource/inter/files");
// satori reads ttf/otf/woff — not woff2, which is why the legacy .woff files
// from @fontsource/inter are the ones loaded here.
const fonts = [
  {
    name: "Inter",
    weight: 400,
    style: "normal",
    data: readFileSync(join(fontDir, "inter-latin-400-normal.woff")),
  },
  {
    name: "Inter",
    weight: 700,
    style: "normal",
    data: readFileSync(join(fontDir, "inter-latin-700-normal.woff")),
  },
  {
    name: "Inter",
    weight: 800,
    style: "normal",
    data: readFileSync(join(fontDir, "inter-latin-800-normal.woff")),
  },
];

/** True when `out` exists and is newer than every path in `inputs`. */
function isFresh(out, inputs) {
  if (!existsSync(out)) return false;
  const outAt = statSync(out).mtimeMs;
  return inputs.every((i) => existsSync(i) && statSync(i).mtimeMs <= outAt);
}

// --- webfont ----------------------------------------------------------------

/**
 * The glyphs the webfont is cut down to.
 *
 * Basic Latin in full — not just what the site currently renders — because the
 * contact form's textarea inherits this font, and a visitor typing a character
 * that isn't in the subset would watch it render in a fallback face mid-word.
 * Every printable ASCII character is therefore included regardless of whether
 * any copy uses it.
 *
 * On top of that: the four non-ASCII characters the page actually renders
 * (© · — and the 👋 emoji, which comes from the system emoji font either way),
 * plus typographic punctuation and Latin-1 accents the copy could reasonably
 * grow into without anyone remembering to revisit this list.
 */
function subsetCharacters() {
  let chars = "";
  for (let code = 0x20; code <= 0x7e; code++)
    chars += String.fromCharCode(code);
  chars += "©·—–…‘’“”€£°×÷±≈≤≥™→←↑↓•§¶†‡";
  chars += "àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿ";
  chars += "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝ";
  return chars;
}

/**
 * Subsets Inter Variable to that character set and writes it to a stable,
 * unhashed path.
 *
 * Two reductions, in order. app.css declares the @font-face by hand (see the
 * comment there) so only the *latin* subset ships instead of all seven —
 * ~170KB of woff2 down to 48KB. This then cuts that 48KB to ~33KB by dropping
 * the several hundred latin glyphs the site has no use for. The saving is
 * smaller than the glyph count suggests because this is a variable font: the
 * weight axis carries outline data per glyph, so each one costs more than it
 * would in a static face, and the shared tables don't shrink at all.
 *
 * It is worth doing anyway because this file is preloaded and blocks first
 * paint — it is the single largest thing on the critical path.
 *
 * The path is fixed rather than content-hashed so <svelte:head> can preload it
 * without chasing a hash; `_headers` gives it a one-year immutable cache in
 * exchange, which it can have because this is a pinned release of Inter.
 */
async function buildFont() {
  const src = join(
    root,
    "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  );
  const out = join(STATIC, "fonts/inter-latin-variable.woff2");
  mkdirSync(dirname(out), { recursive: true });
  if (isFresh(out, [src, fileURLToPath(import.meta.url)])) return;

  const subset = await subsetFont(readFileSync(src), subsetCharacters(), {
    targetFormat: "woff2",
    // Inter Variable ships a 100–900 weight axis. This design uses four
    // weights — normal, medium, semibold, bold — so everything below 400 and
    // above 700 is outline data for weights nothing can request. Clipping the
    // axis to the used range costs nothing visually and takes the file from
    // 34KB to 25KB.
    //
    // Widen this if the design reaches for `font-light` or `font-extrabold`,
    // and keep the `font-weight` range in app.css's @font-face in step —
    // a weight outside the declared range gets synthesised by the browser,
    // which looks noticeably worse than the real thing.
    variationAxes: { wght: { min: 400, max: 700 } },
  });
  writeFileSync(out, subset);
  console.log(
    `[gen-images] fonts/inter-latin-variable.woff2 (${statSync(src).size} -> ${subset.length} bytes)`,
  );
}

// --- hero avatar ------------------------------------------------------------

const AVATAR_SRC = join(root, "static/profile.jpg");
// The avatar is painted at exactly 96 CSS px, so this is its real DPR ladder —
// 1x, 2x, 3x — and nothing else. next.config.mjs needed `imageSizes`/
// `deviceSizes` overrides to stop Next offering variants up to 3840w for it.
const AVATAR_WIDTHS = [96, 192, 288];

async function generateAvatars() {
  for (const width of AVATAR_WIDTHS) {
    const base = sharp(AVATAR_SRC).resize(width, width, { fit: "cover" });

    for (const [ext, encode] of [
      ["avif", (p) => p.avif({ quality: 55 })],
      ["webp", (p) => p.webp({ quality: 78 })],
      ["jpg", (p) => p.jpeg({ quality: 80, mozjpeg: true })],
    ]) {
      const out = join(STATIC, `profile-${width}.${ext}`);
      if (isFresh(out, [AVATAR_SRC])) continue;
      await encode(base.clone()).toFile(out);
      console.log(`[gen-images] ${`profile-${width}.${ext}`}`);
    }
  }
}

// --- Open Graph card --------------------------------------------------------

const ogCard = {
  type: "div",
  props: {
    style: {
      height: "100%",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "64px 72px",
      background:
        "linear-gradient(135deg, #0b1020 0%, #1e1b4b 50%, #312e81 100%)",
      color: "#f8fafc",
      fontFamily: "Inter",
    },
    children: [
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 28,
            opacity: 0.85,
          },
          children: [
            {
              type: "div",
              props: {
                style: {
                  width: 52,
                  height: 52,
                  borderRadius: 9999,
                  background: "#f8fafc",
                  color: "#0b1020",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 26,
                },
                children: "MR",
              },
            },
            { type: "div", props: { children: "rajpoot.dev" } },
          ],
        },
      },
      {
        type: "div",
        props: {
          style: { display: "flex", flexDirection: "column", gap: 20 },
          children: [
            {
              type: "div",
              props: {
                style: { fontSize: 72, fontWeight: 800, lineHeight: 1.05 },
                children: NAME,
              },
            },
            {
              type: "div",
              props: {
                style: { fontSize: 34, opacity: 0.9 },
                children: ROLELINE,
              },
            },
            {
              type: "div",
              props: {
                style: { fontSize: 28, opacity: 0.7, maxWidth: 940 },
                children:
                  "Building scalable, secure, AI-powered systems & robust APIs.",
              },
            },
          ],
        },
      },
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            fontSize: 22,
            opacity: 0.85,
          },
          children: OG_TAGS.map((tag) => ({
            type: "div",
            props: {
              style: {
                padding: "8px 16px",
                borderRadius: 9999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
              },
              children: tag,
            },
          })),
        },
      },
    ],
  },
};

async function generateOgImage() {
  const out = join(STATIC, "opengraph-image.png");
  const inputs = [join(root, "src/lib/seo.ts"), fileURLToPath(import.meta.url)];
  if (isFresh(out, inputs)) return;

  const svg = await satori(ogCard, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } })
    .render()
    .asPng();
  writeFileSync(out, png);
  console.log("[gen-images] opengraph-image.png");
}

// --- Apple touch icon -------------------------------------------------------

// Mirrors static/icon.svg: a deep square with a cyan -> indigo -> fuchsia "M".
// Safari ignores SVG and manifest icons, so this has to be a real 180x180 PNG.
// Hand-authored SVG rather than satori: it is one glyph on a gradient, and
// satori would need the text laid out only to draw it at a fixed size anyway.
const APPLE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <defs>
    <radialGradient id="bg" cx="30%" cy="18%" r="120%">
      <stop offset="0%" stop-color="#2e1c6b"/>
      <stop offset="38%" stop-color="#1a1148"/>
      <stop offset="100%" stop-color="#080913"/>
    </radialGradient>
    <linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2dd4ef"/>
      <stop offset="52%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#e879f9"/>
    </linearGradient>
  </defs>
  <rect width="180" height="180" fill="url(#bg)"/>
  <text x="90" y="90" fill="url(#fg)" font-family="Inter" font-size="128"
        font-weight="800" letter-spacing="-8" text-anchor="middle"
        dominant-baseline="central">M</text>
</svg>`;

function generateAppleIcon() {
  const out = join(STATIC, "apple-icon.png");
  const inputs = [fileURLToPath(import.meta.url)];
  if (isFresh(out, inputs)) return;

  const png = new Resvg(APPLE_ICON_SVG, {
    fitTo: { mode: "width", value: 180 },
    font: {
      fontFiles: [join(fontDir, "inter-latin-800-normal.woff")],
      loadSystemFonts: false,
      defaultFontFamily: "Inter",
    },
  })
    .render()
    .asPng();
  writeFileSync(out, png);
  console.log("[gen-images] apple-icon.png");
}

mkdirSync(STATIC, { recursive: true });
await buildFont();
await generateAvatars();
await generateOgImage();
generateAppleIcon();
