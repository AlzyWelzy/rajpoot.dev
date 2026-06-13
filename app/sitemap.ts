import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Single-page site: the homepage is the only canonical, indexable URL.
  // In-page sections (#about, #projects, …) are fragments of this same page,
  // so they are intentionally not listed as separate entries.
  return [
    {
      url: siteConfig.url,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
