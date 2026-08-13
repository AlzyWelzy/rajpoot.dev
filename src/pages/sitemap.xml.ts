import type { APIRoute } from "astro";
import { siteConfig } from "@/lib/seo";

// Single-page site: the homepage is the only canonical, indexable URL.
// In-page sections (#about, #projects, …) are fragments of this same page,
// so they are intentionally not listed as separate entries. The blog lives
// on its own domain (blog.rajpoot.dev) with its own sitemap; /blog here is
// just a redirect, so it isn't listed.
// lastmod is content-derived (siteConfig.lastUpdated) rather than the
// current date, so redeploys don't churn the freshness signal.
export const GET: APIRoute = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteConfig.url}</loc>
    <lastmod>${siteConfig.lastUpdated}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1</priority>
  </url>
</urlset>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
};
