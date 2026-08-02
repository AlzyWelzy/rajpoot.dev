import { experienceLetterName } from "$lib/data";
import { servePdf } from "$lib/serve-pdf";

import type { RequestHandler } from "./$types";

// Runs on the Worker so the download/noindex headers are real response headers
// rather than something a prerendered file could not carry.
export const prerender = false;

export const GET: RequestHandler = (event) =>
  servePdf(event, experienceLetterName, "Experience letter not found");
