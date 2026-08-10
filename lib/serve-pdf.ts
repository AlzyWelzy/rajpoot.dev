import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Reads a public/ file's bytes. Prefers the Workers ASSETS binding — there
 * is no real filesystem at request time on Cloudflare Workers, and the
 * binding resolves purely by path, so the host in the fetch target is a
 * throwaway. Falls back to Node's fs when no Cloudflare context is
 * available (plain `next dev`/`next start`, e.g. local dev without
 * `initOpenNextCloudflareForDev`, or CI's E2E suite, which builds and runs
 * the site as a normal Node server rather than through Wrangler) — this
 * project isn't committed to Workers as the only deploy target yet, so
 * `servePdf` has to work either way.
 */
async function readPublicFile(fileName: string): Promise<ArrayBuffer | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!env.ASSETS) return null;
    const asset = await env.ASSETS.fetch(`https://assets.local/${fileName}`);
    return asset.ok ? await asset.arrayBuffer() : null;
  } catch {
    try {
      const filePath = path.join(process.cwd(), "public", fileName);
      const buffer = await fs.readFile(filePath);
      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ) as ArrayBuffer;
    } catch {
      return null;
    }
  }
}

/**
 * Serve a PDF from public/ as a download. Shared by the resume, cover-letter,
 * and experience-letter routes so header/caching/robots policy lives in one
 * place.
 */
export async function servePdf(fileName: string, notFoundMessage: string) {
  const bytes = await readPublicFile(fileName);

  if (!bytes) {
    return new NextResponse(notFoundMessage, { status: 404 });
  }

  return new NextResponse(bytes, {
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
