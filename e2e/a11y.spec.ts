import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Axe scan of the homepage in both themes. Reduced motion keeps every section
// fully visible (no mid-animation states) so results are deterministic.
test.describe("accessibility", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`homepage has no serious axe violations (${theme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      // The Turnstile widget in the contact section polls Cloudflare in the
      // background, which never lets networkidle fire below. These tests don't
      // exercise the contact form, so block it rather than weaken the wait for
      // everything else.
      await page.route("https://challenges.cloudflare.com/**", (route) =>
        route.abort(),
      );
      await page.goto("/");
      await page.evaluate(
        (t) => window.localStorage.setItem("theme", t),
        theme,
      );
      await page.reload();
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? ""),
      );

      expect(
        serious.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => n.target.join(" ")),
        })),
      ).toEqual([]);
    });
  }
});
