import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { resumeName } from "@/lib/data";

export async function GET() {
    const filePath = path.join(process.cwd(), "public", resumeName);

    try {
        const fileBuffer = await fs.promises.readFile(filePath);

        return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${resumeName}"`,
            },
        });
    } catch (error) {
        return NextResponse.error();
    }
}
