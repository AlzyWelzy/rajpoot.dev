import { expect, test, type Page } from "@playwright/test";

// The e2e server runs with E2E_TESTING=1 (see playwright.config.ts), so the
// Action executes the full validation/Turnstile path but never calls Resend
// — submissions succeed without sending real email. Turnstile itself is
// real: the widget uses Cloudflare's always-pass testing sitekey, which
// still needs a moment to load its script and generate a token before the
// hidden cf-turnstile-response input is populated.
async function waitForTurnstileToken(page: Page) {
  await page.waitForFunction(
    () =>
      !!document.querySelector<HTMLInputElement>(
        'input[name="cf-turnstile-response"]',
      )?.value,
    { timeout: 15_000 },
  );
}

test.describe("contact form", () => {
  test("submitting a valid message shows success and clears the form", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#contact");
    const email = page.getByPlaceholder("Your email");
    const message = page.getByPlaceholder("Your message");

    await email.click();
    await email.pressSequentially("visitor@example.com");
    await expect(email).toHaveValue("visitor@example.com");
    await message.fill("Hello! Great portfolio.");
    await waitForTurnstileToken(page);
    await page.getByRole("button", { name: /send message/i }).click();

    // Success toast appears and the inputs reset only on success. The
    // Action's first invocation can be slow on CI runners (especially under
    // WebKit), so give the round trip a generous window.
    await expect(page.getByText("Email sent successfully!")).toBeVisible({
      timeout: 15_000,
    });
    await expect(email).toHaveValue("");
    await expect(message).toHaveValue("");
  });

  test("Cmd/Ctrl+Enter submits from the message field", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#contact");
    const email = page.getByPlaceholder("Your email");
    const message = page.getByPlaceholder("Your message");

    await email.click();
    await email.pressSequentially("visitor@example.com");
    await expect(email).toHaveValue("visitor@example.com");
    await message.fill("Submitted with the keyboard shortcut.");
    await waitForTurnstileToken(page);
    await message.press("ControlOrMeta+Enter");

    await expect(page.getByText("Email sent successfully!")).toBeVisible({
      timeout: 15_000,
    });
    await expect(message).toHaveValue("");
  });

  test("a honeypot-filled submission is dropped without telling the bot", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#contact");
    const email = page.getByPlaceholder("Your email");
    const message = page.getByPlaceholder("Your message");

    await email.click();
    await email.pressSequentially("bot@example.com");
    await expect(email).toHaveValue("bot@example.com");
    await message.fill("Buy my product.");

    // Fill the hidden field the way an indiscriminate form-filler would.
    await page
      .locator('input[name="contact_reason_hp"]')
      .evaluate((el: HTMLInputElement) => {
        el.value = "http://spam.example";
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });

    await page.getByRole("button", { name: /send message/i }).click();

    // The server pretends it worked — the whole point is not to signal that
    // the trap was detected.
    await expect(page.getByText("Email sent successfully!")).toBeVisible({
      timeout: 15_000,
    });
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
