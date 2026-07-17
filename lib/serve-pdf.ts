import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/**
 * Serve a PDF from public/ as a download. Shared by the resume, cover-letter,
 * and experience-letter routes so header/caching/robots policy lives in one
 * place.
 */
export async function servePdf(fileName: string, notFoundMessage: string) {
  const filePath = path.join(process.cwd(), "public", fileName);

  try {
    const fileBuffer = await fs.readFile(filePath);
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        // Immutable build asset that only changes on redeploy.
        "Cache-Control":
          "public, max-age=31536000, s-maxage=31536000, immutable",
        // Keep the standalone PDF out of search results so it doesn't compete
        // with the homepage (robots.txt can't cover direct fetches).
        "X-Robots-Tag": "noindex",
      },
    });
  } catch {
    return new NextResponse(notFoundMessage, { status: 404 });
  }
}
