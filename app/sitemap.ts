import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // Single-page site: the homepage is the only canonical, indexable URL.
  // In-page sections (#about, #projects, …) are fragments of this same page,
  // so they are intentionally not listed as separate entries.
  // lastModified is content-derived (siteConfig.lastUpdated) rather than
  // `new Date()`, so redeploys don't churn the lastmod signal.
  return [
    {
      url: siteConfig.url,
      lastModified: siteConfig.lastUpdated,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
