import { error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

/**
 * Serve a PDF from static/ as a download. Shared by the resume, cover-letter
 * and experience-letter routes so header/caching/robots policy lives in one
 * place.
 *
 * The Next version read the file off the filesystem with `fs.readFile`. There
 * is no filesystem on a Worker, so the bytes come from the deployment's static
 * assets instead — via the ASSETS binding in production, and via SvelteKit's
 * `event.fetch` in dev and `vite preview`, where that binding does not exist.
 */
export async function servePdf(
  event: RequestEvent,
  fileName: string,
  notFoundMessage: string,
): Promise<Response> {
  const assetUrl = new URL(`/${fileName}`, event.url.origin);

  const assets = event.platform?.env?.ASSETS;
  const upstream = assets
    ? await assets.fetch(new Request(assetUrl))
    : await event.fetch(assetUrl);

  if (!upstream.ok) {
    error(404, notFoundMessage);
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      // Immutable build asset that only changes on redeploy.
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      // Keep the standalone PDF out of search results so it doesn't compete
      // with the homepage (robots.txt can't cover direct fetches).
      "X-Robots-Tag": "noindex",
    },
  });
}
