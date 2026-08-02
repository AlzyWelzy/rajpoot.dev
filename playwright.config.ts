import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // github: inline PR annotations; html: written to playwright-report/ so the
  // CI artifact upload has something to publish on failure.
  reporter: process.env.CI
    ? ([["github"], ["html", { open: "never" }]] as const)
    : "list",
  // Visual baselines are committed for Linux (CI) only; local dev machines
  // run the visual specs without comparing screenshots.
  ignoreSnapshots: !process.env.CI,
  expect: {
    toHaveScreenshot: {
      // Tolerate anti-aliasing noise, not layout/theme changes.
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    },
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // WebKit matters here: the scroll-spy and theme code carry explicit
    // Safari fallbacks (no `scrollend` support) that Chromium never exercises.
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],
  /**
   * Runs the real thing: `wrangler dev` boots the same workerd runtime
   * Cloudflare runs in production, serving the same build output through the
   * same static-asset pipeline. That fidelity matters more than it did under
   * `next start`, because the security headers now come from `_headers` — a
   * file only the asset server interprets, which a plain Vite preview would
   * ignore entirely.
   *
   * E2E_TESTING=1 is passed twice, doing two different jobs:
   *   • to the *build*, where scripts/gen-headers.mjs uses it to omit
   *     `upgrade-insecure-requests`. WebKit applies that directive to localhost
   *     too, rewriting every asset URL to https and breaking the page under
   *     Playwright's plain-http server. (Under Next this was a per-request host
   *     match; `_headers` is a static file, so the decision moves to build
   *     time. src/lib/security-headers.test.ts asserts the production form,
   *     which is the coverage that trade gives up here.)
   *   • to the *Worker*, where /api/contact uses it to run the full validation
   *     path without actually calling Resend.
   *
   * E2E_SKIP_BUILD=1 reuses an existing build (e.g. one restored from a CI
   * artifact) — which must itself have been produced with E2E_TESTING=1.
   */
  webServer: {
    command:
      process.env.E2E_SKIP_BUILD === "1"
        ? `pnpm exec wrangler dev --port ${PORT} --var E2E_TESTING:1`
        : `E2E_TESTING=1 pnpm build && pnpm exec wrangler dev --port ${PORT} --var E2E_TESTING:1`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
