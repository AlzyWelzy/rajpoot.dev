import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { coverLetterName } from '@/lib/data';


export async function GET() {

    const filePath = path.join(process.cwd(), "public", `${coverLetterName}`);

    try {
        const fileBuffer = await fs.promises.readFile(filePath);
        const response = new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${coverLetterName}"`,
            },
        })

        return response;
    } catch (error) {
        return NextResponse.error();
    }


}
