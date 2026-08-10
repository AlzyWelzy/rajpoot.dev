import { resumeFullStackName } from "@/lib/data";
import { servePdf } from "@/lib/serve-pdf";

export const dynamic = "force-static";

export async function GET() {
  return servePdf(resumeFullStackName, "Resume not found");
}
