import { describe, expect, it, vi } from "vitest";

vi.mock("@opennextjs/cloudflare", async () =>
  (await import("@/test-utils/mocks")).cloudflareAssetsMock(),
);

import { GET as getResume } from "./resume/route";
import { GET as getResumeDevopsEngineer } from "./resume/devops_engineer/route";
import { GET as getResumeFullStack } from "./resume/full_stack/route";
import { GET as getResumeSoftwareEngineer } from "./resume/software_engineer/route";
import { GET as getCoverLetter } from "./cover_letter/route";
import { GET as getExperienceLetter } from "./experience_letter/route";
import {
  coverLetterName,
  experienceLetterName,
  resumeName,
  resumeDevopsEngineerName,
  resumeFullStackName,
  resumeSoftwareEngineerName,
} from "@/lib/data";

// Exercises the thin route handlers themselves — servePdf's own unit test calls
// the helper directly, leaving these route files (which wire each filename to
// the helper) uncovered. This confirms the wiring end to end.
describe("document route handlers", () => {
  const cases = [
    ["resume", getResume, resumeName],
    [
      "resume/devops_engineer",
      getResumeDevopsEngineer,
      resumeDevopsEngineerName,
    ],
    ["resume/full_stack", getResumeFullStack, resumeFullStackName],
    [
      "resume/software_engineer",
      getResumeSoftwareEngineer,
      resumeSoftwareEngineerName,
    ],
    ["cover_letter", getCoverLetter, coverLetterName],
    ["experience_letter", getExperienceLetter, experienceLetterName],
  ] as const;

  it.each(cases)(
    "GET /%s serves its PDF as a download",
    async (_label, handler, name) => {
      const res = await handler();

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/pdf");
      expect(res.headers.get("Content-Disposition")).toBe(
        `attachment; filename="${name}"`,
      );
      expect(res.headers.get("X-Robots-Tag")).toBe("noindex");
    },
  );
});
