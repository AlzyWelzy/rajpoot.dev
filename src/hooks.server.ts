import type { Handle } from "@sveltejs/kit";

import { resolveShortlink } from "$lib/redirects";
import { isLocalHost, securityHeaders } from "$lib/security-headers";

/**
 * Every response the site serves passes through here, which is what lets the
 * security headers be genuinely universal — pages, API responses, PDFs and, in
 * particular, redirects.
 *
 * `run_worker_first` in wrangler.jsonc is the other half: without it Cloudflare
 * would serve prerendered HTML straight off the asset server and this would
 * never run for the homepage. Content-hashed immutable assets are excluded
 * there, since they need no policy of their own.
 */
export const handle: Handle = async ({ event, resolve }) => {
  const upgradeInsecure = !isLocalHost(event.url.hostname);
  const headers = securityHeaders({ upgradeInsecure });

  // Vanity shortlinks are answered before routing, so they never need a route
  // file and never get prerendered as 404s. 308 (not 301) preserves the method
  // and matches what Next's `permanent: true` emitted.
  const destination = resolveShortlink(event.url.pathname);
  if (destination) {
    return new Response(null, {
      status: 308,
      headers: { ...headers, location: destination },
    });
  }

  const response = await resolve(event);

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  // The PDFs live in static/, so they are also reachable at their raw
  // filenames — a path that bypasses the /resume route handler completely, and
  // with it the X-Robots-Tag it sets. Without this the standalone documents can
  // be indexed and compete with the homepage, which is exactly what that header
  // exists to prevent. Deliberately a header and not a robots.txt Disallow: a
  // blocked URL is never fetched, so the crawler never sees the noindex and can
  // still list it.
  if (event.url.pathname.toLowerCase().endsWith(".pdf")) {
    response.headers.set("X-Robots-Tag", "noindex");
  }

  return response;
};
