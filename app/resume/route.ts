import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

import { resumeName } from "@/lib/data";

export const dynamic = "force-static";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", resumeName);

  try {
    const fileBuffer = await fs.readFile(filePath);
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${resumeName}"`,
        // Immutable build asset that only changes on redeploy.
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
        // Keep the standalone PDF out of search results so it doesn't compete
        // with the homepage (robots.txt can't cover direct fetches).
        "X-Robots-Tag": "noindex",
      },
    });
  } catch {
    return new NextResponse("Resume not found", { status: 404 });
  }
}
