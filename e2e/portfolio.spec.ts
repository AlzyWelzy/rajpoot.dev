import { expect, test } from "@playwright/test";

test.describe("portfolio homepage", () => {
  test("renders the hero and primary nav", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: /Manvendra/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Primary" }),
    ).toBeVisible();
  });

  test("theme switch toggles dark mode and persists", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const toggle = page.getByRole("button", {
      name: /Switch to (dark|light) mode/i,
    });

    const startedDark = await html.evaluate((el) =>
      el.classList.contains("dark"),
    );

    await toggle.click();
    if (startedDark) {
      await expect(html).not.toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }

    // Preference survives a reload (persisted to localStorage).
    await page.reload();
    const afterReloadDark = await html.evaluate((el) =>
      el.classList.contains("dark"),
    );
    expect(afterReloadDark).toBe(!startedDark);
  });

  test("nav scroll-spy marks the clicked section active", async ({ page }) => {
    await page.goto("/");
    const projectsLink = page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Projects" });

    await projectsLink.click();
    await expect(projectsLink).toHaveAttribute("aria-current", "page");
    await expect(page.locator("#projects")).toBeInViewport();
  });

  test("contact form enforces required fields", async ({ page }) => {
    await page.goto("/#contact");
    const email = page.getByPlaceholder("Your email");
    const submit = page.getByRole("button", { name: /Send/i });

    await submit.click();
    // Native constraint validation should block submission on the empty,
    // required email field.
    const isInvalid = await email.evaluate(
      (el: HTMLInputElement) => !el.validity.valid,
    );
    expect(isInvalid).toBe(true);
  });

  test("the active pill follows the selected nav item", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    const pill = page.getByTestId("active-pill");

    await expect(pill).toBeVisible();
    const home = await pill.boundingBox();

    await nav.getByRole("link", { name: "Contact" }).click();
    await expect(nav.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    // The pill is a measured CSS transform rather than a motion layout
    // animation, so this is the assertion that it actually moved.
    await expect(async () => {
      const contact = await pill.boundingBox();
      expect(contact!.x).not.toBeCloseTo(home!.x, 0);
    }).toPass({ timeout: 5_000 });
  });
});

test.describe("404", () => {
  test("an unknown path renders the not-found page and links home", async ({
    page,
  }) => {
    const response = await page.goto("/definitely-not-a-real-page");
    expect(response?.status()).toBe(404);

    await expect(
      page.getByRole("heading", { name: /wandered off/i }),
    ).toBeVisible();
    await page.getByRole("link", { name: /back to home/i }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: /Manvendra/i }),
    ).toBeVisible();
  });
});

test.describe("reduced motion", () => {
  test("every section's content is visible without animations", async ({
    page,
  }) => {
    // Several reveals are now CSS-driven rather than motion-driven. The failure
    // mode of that approach is content stuck at opacity 0 for anyone the
    // animation never runs for, so assert the end state directly.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    for (const id of ["#about", "#projects", "#skills", "#experience"]) {
      await page.locator(id).scrollIntoViewIfNeeded();
      await expect(page.locator(id)).toBeVisible();
    }

    // The skill chips are the ones that lost their JS animation entirely.
    const chips = page.locator("#skills li");
    await expect(chips.first()).toBeVisible();
    await expect(chips.last()).toBeVisible();
    await expect(chips.first()).toHaveCSS("opacity", "1");
  });

  test("every skill chip finishes fully opaque with animations enabled", async ({
    page,
  }) => {
    // The counterpart to the test above. The skill chips reveal via a CSS
    // scroll-driven animation whose keyframes start at opacity 0 — if the
    // animation-range ever stops completing, the chips silently stay
    // invisible. Assert the settled state for all 32, not just the first.
    await page.goto("/");

    const chips = page.locator("#skills li");
    // Scroll to the LAST chip, not the section top: the animation is driven by
    // each chip's own `entry` range, and on a phone-width viewport the 32 chips
    // wrap into a block taller than the screen, so bringing only the section
    // heading into view leaves the bottom rows below the fold with their range
    // not yet started. Once the last chip is in view every earlier one has
    // passed `entry 60%` and `animation-fill-mode: both` holds it at opacity 1.
    await chips.last().scrollIntoViewIfNeeded();
    await expect(chips.first()).toBeVisible();

    await expect(async () => {
      const opacities = await chips.evaluateAll((els) =>
        els.map((el) => Number(getComputedStyle(el).opacity)),
      );
      expect(opacities.length).toBeGreaterThan(0);
      expect(opacities.every((o) => o > 0.9)).toBe(true);
    }).toPass({ timeout: 5_000 });
  });
});

test.describe("with animations enabled", () => {
  // Everything else in this suite forces `reducedMotion: "reduce"` for
  // determinism, and every CSS animation on this site lives inside a
  // `prefers-reduced-motion: no-preference` block. That combination meant the
  // animated state was never exercised at all — and it shipped a header that
  // sat half its own width left of centre, because a keyframe animating
  // `transform` composed with Tailwind's standalone `translate` property
  // instead of overriding it.
  //
  // These tests run with motion ON specifically to cover that gap.

  test("the header stays centred once its entrance animation settles", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");

    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav).toBeVisible();

    await expect(async () => {
      const box = (await nav.boundingBox())!;
      const viewport = page.viewportSize()!;
      const navCentre = box.x + box.width / 2;
      expect(Math.abs(navCentre - viewport.width / 2)).toBeLessThan(4);
    }).toPass({ timeout: 5_000 });
  });

  test("no element composes a keyframe transform with a Tailwind translate", async ({
    page,
  }) => {
    // The general form of the bug above. `translate`/`scale`/`rotate` are
    // separate properties from `transform` and the browser composes them, so an
    // element carrying both a utility and a keyframe silently gets the sum.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await page.waitForTimeout(1200);

    const offenders = await page.evaluate(() =>
      [...document.querySelectorAll("*")]
        .filter((el) => {
          const cs = getComputedStyle(el);
          if (cs.animationName === "none") return false;
          const standalone = [cs.translate, cs.scale, cs.rotate].some(
            (v) => v && v !== "none",
          );
          if (!standalone) return false;
          // Composing is only a bug when the keyframe actually leaves a
          // transform behind; an identity matrix is harmless.
          return (
            cs.transform !== "none" &&
            cs.transform !== "matrix(1, 0, 0, 1, 0, 0)"
          );
        })
        .map((el) => `${el.tagName}.${el.className}`),
    );

    expect(offenders).toEqual([]);
  });

  test("sections still reveal to fully visible", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");

    for (const id of ["#about", "#projects", "#skills", "#experience"]) {
      await page.locator(id).scrollIntoViewIfNeeded();
      await expect(async () => {
        const opacity = await page
          .locator(id)
          .evaluate((el) => Number(getComputedStyle(el).opacity));
        expect(opacity).toBeGreaterThan(0.95);
      }).toPass({ timeout: 5_000 });
    }
  });
});
