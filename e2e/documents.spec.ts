import { expect, test } from "@playwright/test";

const documents = [
  { path: "/resume", filename: "Manvendra_Rajpoot_Resume.pdf" },
  { path: "/cover_letter", filename: "Manvendra_Rajpoot_Cover_Letter.pdf" },
  {
    path: "/experience_letter",
    filename: "Manvendra_Rajpoot_Experience_Letter.pdf",
  },
];

test.describe("well-known routes", () => {
  test("/.well-known/security.txt is served", async ({ request }) => {
    const res = await request.get("/.well-known/security.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("Contact: mailto:manvendra@rajpoot.dev");
    expect(body).toContain("Expires:");
  });
});

test.describe("document routes", () => {
  for (const { path, filename } of documents) {
    test(`${path} serves the PDF as a noindex download`, async ({
      request,
    }) => {
      const res = await request.get(path);

      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toBe("application/pdf");
      expect(res.headers()["content-disposition"]).toBe(
        `attachment; filename="${filename}"`,
      );
      expect(res.headers()["x-robots-tag"]).toBe("noindex");

      // Actually a PDF, not an HTML error page.
      const body = await res.body();
      expect(body.subarray(0, 5).toString()).toBe("%PDF-");
    });
  }
});
