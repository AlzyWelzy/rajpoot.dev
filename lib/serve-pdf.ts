import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Serve a PDF from public/ as a download. Shared by the resume, cover-letter,
 * and experience-letter routes so header/caching/robots policy lives in one
 * place.
 *
 * Reads via the Workers ASSETS binding rather than Node's fs — there is no
 * real filesystem at request time on Cloudflare Workers. The binding
 * resolves purely by path, so the host in the fetch target is a throwaway.
 */
export async function servePdf(fileName: string, notFoundMessage: string) {
  const { env } = await getCloudflareContext({ async: true });

  // Typed optional because not every @opennextjs/cloudflare project
  // configures assets, but wrangler.jsonc always does — a missing binding
  // here means the deploy is misconfigured, not a normal 404.
  if (!env.ASSETS) {
    throw new Error("ASSETS binding is not configured (check wrangler.jsonc)");
  }

  const asset = await env.ASSETS.fetch(`https://assets.local/${fileName}`);

  if (!asset.ok) {
    return new NextResponse(notFoundMessage, { status: 404 });
  }

  return new NextResponse(asset.body, {
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
