import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";
import { links } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...links
      .filter((link) => link.hash !== "#home")
      .map((link) => ({
        url: `${siteConfig.url}/${link.hash}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
  ];

  return entries;
}
