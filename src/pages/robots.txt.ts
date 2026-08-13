import type { APIRoute } from "astro";
import { siteConfig } from "@/lib/seo";

export const GET: APIRoute = () => {
  const host = new URL(siteConfig.url).host;
  const body = `User-agent: *
Allow: /

Sitemap: ${siteConfig.url}/sitemap.xml
Host: ${host}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
};
