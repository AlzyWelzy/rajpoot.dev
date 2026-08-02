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
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderHeadersFile } from "../src/lib/security-headers.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "_headers");

const isE2E = process.env.E2E_TESTING === "1";
const contents = renderHeadersFile({ upgradeInsecure: !isE2E });

mkdirSync(dirname(OUT), { recursive: true });

const existing = existsSync(OUT) ? readFileSync(OUT, "utf8") : null;
if (existing === contents) {
  console.log("[gen-headers] _headers already current");
} else {
  writeFileSync(OUT, contents);
  console.log(
    `[gen-headers] _headers written (upgrade-insecure-requests: ${!isE2E})`,
  );
}
