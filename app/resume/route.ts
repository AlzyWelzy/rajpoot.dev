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
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch {
    return new NextResponse("Resume not found", { status: 404 });
  }
}
