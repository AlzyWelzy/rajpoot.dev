#!/usr/bin/env node
/**
 * Post-build assertions on the artifact that actually gets uploaded.
 *
 * These exist because of a real near-miss: a `_headers` left behind by an E2E
 * build — deliberately missing `upgrade-insecure-requests` — survived into a
 * production build and was deployed. Nothing failed. The build log said
 * "already current", the unit tests passed (they test the *generator*, not the
 * output), and the E2E suite passed (it runs against the E2E build, where the
 * directive is absent by design). It was only visible by curling the live site.
 *
 * The gap those layers share is that none of them look at the bytes being
 * shipped. This does.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, ".svelte-kit/cloudflare");

const isE2E = process.env.E2E_TESTING === "1";
const failures = [];

function check(label, condition, detail = "") {
  if (!condition) failures.push(`${label}${detail ? `\n    ${detail}` : ""}`);
}

// --- the artifact exists at all --------------------------------------------

check("build output is missing", existsSync(OUT), OUT);
if (!existsSync(OUT)) {
  console.error("[verify-build] no build output — run `pnpm build`");
  process.exit(1);
}

// --- _headers matches this build's intent ----------------------------------

const headersPath = join(OUT, "_headers");
check("_headers missing from the build output", existsSync(headersPath));

if (existsSync(headersPath)) {
  const headers = readFileSync(headersPath, "utf8");
  const rootHeaders = readFileSync(join(root, "_headers"), "utf8");

  // The adapter copies the root file in and appends its own block, so the
  // generated part must be a prefix of what shipped. A mismatch means the
  // artifact predates the current `_headers`.
  check(
    "_headers in the build output is stale",
    headers.startsWith(rootHeaders.trimEnd()),
    "the artifact does not start with the freshly generated _headers — rebuild",
  );

  const hasUpgrade = headers.includes("upgrade-insecure-requests");
  check(
    isE2E
      ? "E2E build must NOT ship upgrade-insecure-requests"
      : "production build MUST ship upgrade-insecure-requests",
    hasUpgrade === !isE2E,
    isE2E
      ? "WebKit applies it to localhost and breaks every asset load under Playwright"
      : "a stale _headers from an E2E build has leaked into a production build",
  );

  for (const directive of [
    "frame-ancestors 'none'",
    "object-src 'none'",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
  ]) {
    check(`_headers is missing ${directive}`, headers.includes(directive));
  }
}

// --- no framework JavaScript -----------------------------------------------

const html = join(OUT, "index.html");
if (existsSync(html)) {
  const doc = readFileSync(html, "utf8");
  const scripts = [...doc.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map(
    (m) => m[1],
  );

  // `csr = false` is easy to undo by accident — a stray `export const csr` or a
  // component that needs hydration would silently restore ~31KB of runtime and
  // router. See src/routes/+layout.ts.
  check(
    "the homepage loads a SvelteKit client bundle — has csr:false regressed?",
    !scripts.some((s) => s.includes("/_app/immutable/")),
    `scripts: ${scripts.join(", ")}`,
  );
  check(
    "the homepage does not load the enhancement bundle",
    scripts.some((s) => s.startsWith("/_enhance/")),
    `scripts: ${scripts.join(", ")}`,
  );

  // The CSS is inlined so first paint doesn't wait on a second round trip.
  check(
    "the stylesheet is no longer inlined into the document",
    doc.includes("<style>"),
    "check kit.inlineStyleThreshold in svelte.config.js against the CSS size",
  );
}

// --- the assets the document references actually exist ---------------------

for (const asset of [
  "fonts/inter-latin-variable.woff2",
  "profile-96.avif",
  "opengraph-image.png",
  "apple-icon.png",
  "favicon.ico",
]) {
  check(`missing asset: ${asset}`, existsSync(join(OUT, asset)));
}

if (existsSync(join(OUT, "_enhance"))) {
  const bundles = readdirSync(join(OUT, "_enhance"));
  check(
    "expected exactly one enhancement bundle",
    bundles.length === 1,
    bundles.join(", "),
  );
}

// --- report ----------------------------------------------------------------

if (failures.length) {
  console.error(
    `[verify-build] ${failures.length} problem(s) with the build output:\n` +
      failures.map((f) => `  ✗ ${f}`).join("\n"),
  );
  process.exit(1);
}

const size = statSync(join(OUT, "index.html")).size;
console.log(
  `[verify-build] ok — ${isE2E ? "E2E" : "production"} build, ` +
    `index.html ${size} bytes`,
);
