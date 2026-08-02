import { siteConfig } from "$lib/seo";

import type { RequestHandler } from "./$types";

export const prerender = true;

export const GET: RequestHandler = () =>
  new Response(
    JSON.stringify(
      {
        name: `${siteConfig.name} — Portfolio`,
        short_name: siteConfig.shortName,
        description: siteConfig.description,
        start_url: "/",
        display: "standalone",
        background_color: "#111827",
        theme_color: "#0b1020",
        icons: [
          { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      null,
      2,
    ),
    { headers: { "Content-Type": "application/manifest+json" } },
  );
