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
  // (darwin) run the visual specs without comparing screenshots.
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
  // Run the real production build through wrangler dev (real workerd, not a
  // Node dev server) so tests exercise what actually ships. E2E_TESTING and
  // TURNSTILE_SECRET are Worker vars, injected ad hoc via --var rather than
  // baked into .dev.vars, so this never depends on (or silently disturbs) a
  // developer's real local Turnstile secret. E2E_SKIP_BUILD=1 reuses a
  // `dist/` restored from a shared CI artifact instead of rebuilding.
  webServer: {
    command:
      process.env.E2E_SKIP_BUILD === "1"
        ? `wrangler dev --port ${PORT} --var E2E_TESTING:1 --var TURNSTILE_SECRET:1x0000000000000000000000000000000AA`
        : `astro build && wrangler dev --port ${PORT} --var E2E_TESTING:1 --var TURNSTILE_SECRET:1x0000000000000000000000000000000AA`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // Cloudflare's official always-pass testing sitekey — public and safe
      // to commit (it's a documented constant, not a secret). The contact
      // form's Turnstile-dependent tests must not depend on this machine's
      // real widget credentials, or they'd need a real interactive
      // challenge to ever resolve in headless automation.
      PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000BB",
    },
  },
});
