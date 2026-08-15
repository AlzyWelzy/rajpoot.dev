import { expect, test } from "@playwright/test";

// Visual baselines are committed for Linux only (what CI runs on); locally
// the comparisons are skipped via `ignoreSnapshots` in playwright.config.ts.
// No baselines exist yet for this Astro rewrite — the first CI run against
// this branch should be allowed to write them (`--update-snapshots`), same
// as the original workflow documented below.
//
// To (re)generate baselines, run the suite in the Playwright Docker image:
//   docker run --rm -v "$PWD":/work -v /work/node_modules -w /work \
//     mcr.microsoft.com/playwright:v<playwright-version>-noble \
//     bash -c "corepack enable && pnpm install --frozen-lockfile && \
//       CI=1 pnpm exec playwright test e2e/visual.spec.ts --update-snapshots"

async function openWithTheme(
  page: import("@playwright/test").Page,
  theme: string,
) {
  // The Turnstile widget in the contact section polls Cloudflare in the
  // background, which never lets networkidle fire below. These tests don't
  // exercise the contact form, so block it rather than weaken the wait for
  // everything else.
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.abort(),
  );
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

  // Every section that renders icons, imagery or cards. `#projects` and
  // `#contact` were added after an icon swap changed the project-card buttons
  // and the submit button and no baseline covered either — the suite only
  // watched the hero and the timeline.
  // `scroll: false` for the hero on purpose: it is already in view at rest,
  // and scrolling would move the fixed nav over it, changing the capture and
  // invalidating a baseline that is otherwise unaffected by this change.
  const SECTIONS = [
    { id: "#home", name: "hero", scroll: false },
    { id: "#experience", name: "experience", scroll: true },
    { id: "#projects", name: "projects", scroll: true },
    { id: "#contact", name: "contact", scroll: true },
  ] as const;

  for (const theme of ["light", "dark"] as const) {
    for (const section of SECTIONS) {
      test(`${section.name} section (${theme})`, async ({ page }) => {
        await openWithTheme(page, theme);
        if (section.scroll) {
          await page.locator(section.id).scrollIntoViewIfNeeded();
        }
        await expect(page.locator(section.id)).toHaveScreenshot(
          `${section.name}-${theme}.png`,
        );
      });
    }
  }
});
