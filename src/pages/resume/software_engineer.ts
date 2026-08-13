import type { APIRoute } from "astro";
import { resumeSoftwareEngineerName } from "@/lib/data";
import { servePdf } from "@/lib/serve-pdf";

export const prerender = false;

export const GET: APIRoute = () =>
  servePdf(resumeSoftwareEngineerName, "Resume not found");
