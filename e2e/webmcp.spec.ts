import { expect, test, type Page } from "@playwright/test";

// The contact form as a WebMCP tool, driven through the browser's real
// document.modelContext rather than a simulated SubmitEvent: getTools() shows
// the schema Chrome actually synthesized from the markup, and executeTool()
// runs the same fill → confirm → respondWith() path an in-browser agent does.
//
// WebMCP is Chromium-only and still behind a feature flag, so this runs on the
// desktop Chromium project with the flag set, and skips itself if the browser
// build doesn't expose the API at all — which says nothing about the site.

type RegisteredTool = {
  name: string;
  description: string;
  // A JSON string in current Chrome; tolerate an object too.
  inputSchema: string | Record<string, unknown>;
};
type ModelContext = {
  getTools(): Promise<RegisteredTool[]>;
  executeTool(tool: RegisteredTool, args: string): Promise<string>;
};
type WithModelContext = Document & { modelContext: ModelContext };
type AgentWindow = Window & { __toolResult?: { ok: string } | { err: string } };

// Decided from browserName alone, before any browser launches: the flag below
// is Chromium's, and WebKit on Linux refuses to start with it at all.
test.skip(({ browserName }) => browserName !== "chromium", "Chromium-only");
test.use({ launchOptions: { args: ["--enable-features=WebMCPTesting"] } });

test.beforeEach(async ({ page }, testInfo) => {
  // mobile-chrome is Chromium too; one desktop project is coverage enough.
  test.skip(testInfo.project.name !== "chromium", "desktop Chromium only");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#contact");
  test.skip(
    !(await page.evaluate(() => "modelContext" in document)),
    "this Chromium build does not expose WebMCP",
  );
  // The tool registers at parse time, but a call made before React hydrates
  // is cancelled by Chrome when hydration updates the form (by design — see
  // components/contact.tsx). Turnstile's token is the readiness signal: its
  // script is injected by an effect, so a token means the form is live.
  await page.waitForFunction(
    () =>
      !!document.querySelector<HTMLInputElement>(
        'input[name="cf-turnstile-response"]',
      )?.value,
    { timeout: 15_000 },
  );
});

/** Starts a tool call the way an agent would; the result lands on window. */
async function invokeContactTool(page: Page, args: Record<string, string>) {
  await page.evaluate(async (args) => {
    const { modelContext } = document as WithModelContext;
    const [tool] = await modelContext.getTools();
    const win = window as AgentWindow;
    delete win.__toolResult;
    modelContext.executeTool(tool!, JSON.stringify(args)).then(
      (ok) => (win.__toolResult = { ok }),
      (err: unknown) => (win.__toolResult = { err: String(err) }),
    );
  }, args);
}

async function toolResult(page: Page) {
  await page.waitForFunction(() => !!(window as AgentWindow).__toolResult, {
    timeout: 15_000,
  });
  return page.evaluate(() => (window as AgentWindow).__toolResult!);
}

test("registers one described tool whose schema is exactly the visible fields", async ({
  page,
}) => {
  const tools = await page.evaluate(() =>
    (document as WithModelContext).modelContext.getTools(),
  );
  expect(tools.map((t) => t.name)).toEqual(["send_contact_message"]);

  const [tool] = tools;
  const schema =
    typeof tool!.inputSchema === "string"
      ? JSON.parse(tool!.inputSchema)
      : tool!.inputSchema;
  // The honeypot (read-only) and Turnstile's token (type=hidden) must not be
  // offered to an agent.
  expect(Object.keys(schema.properties)).toEqual([
    "senderName",
    "senderEmail",
    "message",
  ]);
  expect(schema.required).toEqual(["senderName", "senderEmail", "message"]);
  for (const param of Object.values(schema.properties)) {
    expect(param).toMatchObject({ type: "string" });
    expect((param as { description?: string }).description).toBeTruthy();
  }
});

test("an agent fills the form, the visitor sends it, and the agent gets the result", async ({
  page,
}) => {
  let actionPosts = 0;
  page.on("request", (req) => {
    if (req.method() === "POST" && req.headers()["next-action"]) actionPosts++;
  });

  await invokeContactTool(page, {
    senderName: "Agent Test",
    senderEmail: "agent@example.com",
    message: "Hello from a WebMCP agent.",
  });

  // No toolautosubmit: the form is filled and waits on the visitor.
  const send = page.getByRole("button", { name: /send message/i });
  await expect(page.getByPlaceholder("Your name")).toHaveValue("Agent Test");
  await expect(page.getByPlaceholder("Your email")).toHaveValue(
    "agent@example.com",
  );
  await expect(send).toBeFocused();
  expect(await page.evaluate(() => (window as AgentWindow).__toolResult)).toBe(
    undefined,
  );

  await send.click();

  const result = await toolResult(page);
  expect(result).toHaveProperty("ok");
  expect(JSON.parse((result as { ok: string }).ok)).toEqual({ sent: true });
  await expect(page.getByText("Email sent successfully!")).toBeVisible();
  await expect(page.getByPlaceholder("Your message")).toHaveValue("");
  // Answering the agent must not cost a second send.
  expect(actionPosts).toBe(1);
});

test("an invalid value is reported to the agent and nothing is sent", async ({
  page,
}) => {
  let actionPosts = 0;
  page.on("request", (req) => {
    if (req.method() === "POST" && req.headers()["next-action"]) actionPosts++;
  });

  await invokeContactTool(page, {
    senderName: "Agent Test",
    senderEmail: "not-an-email",
    message: "Hello.",
  });
  await page.getByRole("button", { name: /send message/i }).click();

  const result = await toolResult(page);
  expect(result).toHaveProperty("err");
  expect((result as { err: string }).err).toContain("senderEmail");
  expect(actionPosts).toBe(0);
});
