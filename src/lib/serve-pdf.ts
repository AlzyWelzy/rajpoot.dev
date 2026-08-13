import { env } from "cloudflare:workers";

/**
 * Serve a PDF from public/ as a download via the Workers ASSETS binding.
 * Shared by the resume (+ variants), cover-letter, and experience-letter
 * endpoints so header/caching/robots policy lives in one place.
 */
export async function servePdf(
  fileName: string,
  notFoundMessage: string,
): Promise<Response> {
  const asset = await env.ASSETS.fetch(`https://assets.local/${fileName}`);

  if (!asset.ok) {
    return new Response(notFoundMessage, { status: 404 });
  }

  return new Response(asset.body, {
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
