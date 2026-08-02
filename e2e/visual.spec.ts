import { expect, test } from "@playwright/test";

// Visual baselines are committed for Linux only (what CI runs on); locally
// the comparisons are skipped via `ignoreSnapshots` in playwright.config.ts.
// To (re)generate baselines, run the suite in the Playwright Docker image:
//   docker run --rm -v "$PWD":/work -v /work/node_modules -w /work \
//     mcr.microsoft.com/playwright:v<playwright-version>-noble \
//     bash -c "corepack enable && pnpm install --frozen-lockfile && \
//       CI=1 pnpm exec playwright test e2e/visual.spec.ts --update-snapshots"

async function openWithTheme(
  page: import("@playwright/test").Page,
  theme: string,
) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate((t) => window.localStorage.setItem("theme", t), theme);
  await page.reload();
  await page.waitForLoadState("networkidle");
}

test.describe("visual regression", () => {
  // Desktop Chromium only: one stable baseline set. Mobile/WebKit rendering
  // differs per engine and was flaky to baseline; they keep functional
  // coverage via the other specs.
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || !!isMobile,
    "visual baselines are desktop-chromium only",
  );

  for (const theme of ["light", "dark"] as const) {
    test(`hero section (${theme})`, async ({ page }) => {
      await openWithTheme(page, theme);
      await expect(page.locator("#home")).toHaveScreenshot(`hero-${theme}.png`);
    });

    test(`experience timeline (${theme})`, async ({ page }) => {
      await openWithTheme(page, theme);
      await page.locator("#experience").scrollIntoViewIfNeeded();
      await expect(page.locator("#experience")).toHaveScreenshot(
        `experience-${theme}.png`,
      );
    });
  }
});
