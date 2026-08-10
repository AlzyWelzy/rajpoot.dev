import { describe, expect, it } from "vitest";

// Deliberately no mock of @opennextjs/cloudflare here. Vitest runs as plain
// Node, same as `next start`/CI's E2E suite — there is no global Cloudflare
// context registered, so the real getCloudflareContext throws, and servePdf
// must fall back to reading public/ via fs rather than 404ing. This is a
// regression test: an earlier version had no fallback and broke every PDF
// route under `next start` (caught by CI's E2E suite, not this unit suite,
// since the mocked test in serve-pdf.test.ts never exercises this path).
import { servePdf } from "./serve-pdf";
import { resumeName } from "./data";

describe("servePdf (no Cloudflare context available)", () => {
  it("falls back to reading public/ via fs", async () => {
    const res = await servePdf(resumeName, "Resume not found");

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toBe(
      `attachment; filename="${resumeName}"`,
    );
  });

  it("still 404s with the given message when the file doesn't exist", async () => {
    const res = await servePdf("does-not-exist.pdf", "Nope");

    expect(res.status).toBe(404);
    expect(await res.text()).toBe("Nope");
  });
});
