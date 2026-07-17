import { expect, test } from "@playwright/test";

// The e2e server runs with E2E_TESTING=1, so the server action executes the
// full validation/limiter path but never calls Resend — submissions succeed
// without sending real email.
test.describe("contact form", () => {
  test("submitting a valid message shows success and clears the form", async ({
    page,
  }) => {
    await page.goto("/#contact");
    const email = page.getByPlaceholder("Your email");
    const message = page.getByPlaceholder("Your message");

    await email.fill("visitor@example.com");
    await message.fill("Hello! Great portfolio.");
    await page.getByRole("button", { name: /send message/i }).click();

    // Success toast appears and the inputs reset only on success.
    await expect(page.getByText("Email sent successfully!")).toBeVisible();
    await expect(email).toHaveValue("");
    await expect(message).toHaveValue("");
  });

  test("Cmd/Ctrl+Enter submits from the message field", async ({ page }) => {
    await page.goto("/#contact");
    const message = page.getByPlaceholder("Your message");

    await page.getByPlaceholder("Your email").fill("visitor@example.com");
    await message.fill("Submitted with the keyboard shortcut.");
    await message.press("ControlOrMeta+Enter");

    await expect(page.getByText("Email sent successfully!")).toBeVisible();
    await expect(message).toHaveValue("");
  });
});

test.describe("keyboard navigation", () => {
  test("skip link is the first tab stop and jumps to the content", async ({
    page,
    browserName,
  }) => {
    // Safari/WebKit only tabs to links when the user enables it in settings,
    // so Tab never reaches the skip link there.
    test.skip(browserName === "webkit", "WebKit does not Tab to links");
    await page.goto("/");

    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: "Skip to content" });
    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
    await expect(page.locator("#main")).toBeInViewport();
  });
});
