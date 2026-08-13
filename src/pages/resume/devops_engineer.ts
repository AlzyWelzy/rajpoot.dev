import type { APIRoute } from "astro";
import { resumeDevopsEngineerName } from "@/lib/data";
import { servePdf } from "@/lib/serve-pdf";

export const prerender = false;

export const GET: APIRoute = () =>
  servePdf(resumeDevopsEngineerName, "Resume not found");
