import type { APIRoute } from "astro";
import { coverLetterName } from "@/lib/data";
import { servePdf } from "@/lib/serve-pdf";

export const prerender = false;

export const GET: APIRoute = () =>
  servePdf(coverLetterName, "Cover letter not found");
