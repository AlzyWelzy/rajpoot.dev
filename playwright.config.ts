import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
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
  // E2E_TESTING drops the CSP's upgrade-insecure-requests directive, which
  // WebKit applies even to localhost (breaking asset loads over plain http).
  webServer: {
    command: `E2E_TESTING=1 pnpm build && E2E_TESTING=1 pnpm start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
