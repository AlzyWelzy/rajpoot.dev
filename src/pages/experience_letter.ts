import type { APIRoute } from "astro";
import { experienceLetterName } from "@/lib/data";
import { servePdf } from "@/lib/serve-pdf";

export const prerender = false;

export const GET: APIRoute = () =>
  servePdf(experienceLetterName, "Experience letter not found");
