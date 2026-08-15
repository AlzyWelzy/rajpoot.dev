import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Axe scan of every rendered route in both themes. Reduced motion keeps every
// section fully visible (no mid-animation states) so results are
// deterministic.
//
// The 404 page is included because it is a real route with its own heading,
// link and layout — it renders through the same BaseLayout, so a regression
// in the shell (skip link, landmark structure, contrast) shows up there too,
// and nothing else in the suite looked at it.
const ROUTES = [
  { name: "homepage", path: "/" },
  { name: "404 page", path: "/this-route-does-not-exist" },
] as const;

test.describe("accessibility", () => {
  for (const theme of ["light", "dark"] as const) {
    for (const route of ROUTES) {
      test(`${route.name} has no serious axe violations (${theme})`, async ({
        page,
      }) => {
        // The Turnstile widget in the contact section polls Cloudflare in
        // the background, which never lets networkidle fire below. This test
        // doesn't exercise the contact form, so block it rather than weaken
        // the wait for everything else.
        await page.route("https://challenges.cloudflare.com/**", (r) =>
          r.abort(),
        );
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(route.path);
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
  }
});
