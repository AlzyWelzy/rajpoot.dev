import { resumeDevopsEngineerName } from "@/lib/data";
import { servePdf } from "@/lib/serve-pdf";

export const dynamic = "force-static";

export async function GET() {
  return servePdf(resumeDevopsEngineerName, "Resume not found");
}
