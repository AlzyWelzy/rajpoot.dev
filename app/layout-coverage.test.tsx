import { describe, expect, it, vi } from "vitest";

// next/font/google runs a build step; stub it so importing the layout module
// (which calls Inter() at module scope) works under vitest.
vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "font-inter", variable: "--font-inter" }),
}));

import RootLayout, { metadata, viewport } from "./layout";

describe("root layout", () => {
  it("exports SEO metadata and a themed viewport", () => {
    expect(metadata.metadataBase).toBeTruthy();
    expect(metadata.openGraph).toBeTruthy();
    expect(viewport.themeColor).toBeTruthy();
  });

  it("builds the document shell around its children", () => {
    expect(RootLayout({ children: null })).toBeTruthy();
  });
});
