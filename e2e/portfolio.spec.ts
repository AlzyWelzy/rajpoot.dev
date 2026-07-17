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
});
