#!/usr/bin/env node
/**
 * Writes static/_headers from src/lib/security-headers.js.
 *
 * Generated rather than hand-maintained so the headers on asset-server
 * responses cannot drift from the ones hooks.server.ts puts on Worker
 * responses. The adapter appends its own immutable-caching block to whatever
 * this file contains, so the two coexist.
 *
 * E2E_TESTING=1 drops `upgrade-insecure-requests`, which WebKit would otherwise
 * apply to localhost and break every asset load under Playwright's plain-http
 * server. src/lib/security-headers.test.ts asserts the production form.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderHeadersFile } from "../src/lib/security-headers.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "_headers");

const isE2E = process.env.E2E_TESTING === "1";
const contents = renderHeadersFile({ upgradeInsecure: !isE2E });

mkdirSync(dirname(OUT), { recursive: true });

// Always rewrite, never skip on a content match.
//
// This file is the one build output whose *correct* content depends on an
// environment variable rather than on source. Skipping the write when the
// bytes happen to match is how a `_headers` left behind by an E2E build — one
// deliberately missing `upgrade-insecure-requests` — can survive into a
// production build and ship. The write costs nothing; the failure mode is a
// security directive silently absent in production.
writeFileSync(OUT, contents);
console.log(
  `[gen-headers] _headers written (upgrade-insecure-requests: ${!isE2E})`,
);
