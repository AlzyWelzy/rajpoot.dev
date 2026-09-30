import { llmsTxt } from "@/lib/llms-txt";

// Prerendered at build time like every other route; the content only changes
// when lib/seo.ts or lib/data.ts does, which means a redeploy anyway.
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsTxt(), {
    headers: {
      // Served as text/plain, the de facto convention (llmstxt.org serves its
      // own that way): text/markdown makes some browsers download the file
      // instead of showing it.
      "Content-Type": "text/plain; charset=utf-8",
      // Meant for language models, not search results — the same reasoning as
      // the PDFs' noindex: a crawlable standalone text file would otherwise
      // compete with the homepage for the same queries. A header rather than a
      // robots.txt Disallow, because a disallowed URL is never fetched and so
      // can't be read by the agents it exists for.
      "X-Robots-Tag": "noindex",
    },
  });
}
