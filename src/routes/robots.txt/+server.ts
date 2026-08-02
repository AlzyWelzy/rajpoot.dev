import { siteConfig } from "$lib/seo";

import type { RequestHandler } from "./$types";

export const prerender = true;

// Deliberately no `Disallow` for the PDFs: a blocked URL is never fetched, so
// the crawler never sees the X-Robots-Tag noindex and can still list the URL.
// The header (set in serve-pdf.ts and hooks.server.ts) is what actually keeps
// them out of the index.
export const GET: RequestHandler = () =>
  new Response(
    `User-agent: *
Allow: /

Host: ${new URL(siteConfig.url).host}
Sitemap: ${siteConfig.url}/sitemap.xml
`,
    { headers: { "Content-Type": "text/plain" } },
  );
