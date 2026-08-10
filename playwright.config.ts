import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

// Cloudflare's own publicly documented testing sitekey/secret pair — not
// secrets, safe to commit. The sitekey always renders invisibly and always
// passes; the matching secret makes siteverify always return success. Used
// so E2E can exercise the real contact-form → Turnstile → siteverify path
// end to end without flakiness from waiting on a real challenge, and without
// needing the production widget's real credentials in CI.
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000BB";
const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";

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
  // Run the production build so tests exercise what actually ships.
  // E2E_TESTING is a *runtime* flag only: it tells the contact-form action to
  // validate but not actually send. The CSP's upgrade-insecure-requests
  // directive (which WebKit applies even to localhost, breaking plain-http
  // asset loads) is dropped by host match in next.config.mjs instead, so the
  // build itself is an ordinary production build — which is what lets CI build
  // once and share it with the Lighthouse job. E2E_SKIP_BUILD=1 reuses a
  // `.next` restored from that shared artifact.
  webServer: {
    // TURNSTILE_SECRET is only needed at runtime (`pnpm start`), but the
    // site key has to be present at build time too — Next inlines
    // NEXT_PUBLIC_* values into the static output. When E2E_SKIP_BUILD=1,
    // that build already happened in CI's shared `build` job, which sets
    // the same site key for its `pnpm build` step (see ci.yml).
    command:
      process.env.E2E_SKIP_BUILD === "1"
        ? `TURNSTILE_SECRET=${TURNSTILE_TEST_SECRET} E2E_TESTING=1 pnpm start --port ${PORT}`
        : `NEXT_PUBLIC_TURNSTILE_SITE_KEY=${TURNSTILE_TEST_SITE_KEY} pnpm build && TURNSTILE_SECRET=${TURNSTILE_TEST_SECRET} E2E_TESTING=1 pnpm start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
