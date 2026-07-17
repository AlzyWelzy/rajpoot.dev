import { describe, expect, it } from "vitest";

import { servePdf } from "./serve-pdf";
import { coverLetterName, experienceLetterName, resumeName } from "./data";

describe("servePdf", () => {
  it("serves an existing public PDF with download headers", async () => {
    const res = await servePdf(resumeName, "Resume not found");

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toBe(
      `attachment; filename="${resumeName}"`,
    );
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(res.headers.get("Cache-Control")).toContain("immutable");
  });

  it("serves every configured document from public/", async () => {
    for (const name of [resumeName, coverLetterName, experienceLetterName]) {
      const res = await servePdf(name, "missing");
      expect(res.status, `expected ${name} to exist in public/`).toBe(200);
    }
  });

  it("returns 404 with the given message when the file is missing", async () => {
    const res = await servePdf("does-not-exist.pdf", "Nope");

    expect(res.status).toBe(404);
    expect(await res.text()).toBe("Nope");
  });
});
