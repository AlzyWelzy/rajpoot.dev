import type { APIRoute } from "astro";
import { resumeFullStackName } from "@/lib/data";
import { servePdf } from "@/lib/serve-pdf";

export const prerender = false;

export const GET: APIRoute = () =>
  servePdf(resumeFullStackName, "Resume not found");
