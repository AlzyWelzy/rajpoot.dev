// Every icon on this site is inlined as static SVG markup, resolved once at
// build time via Vite's `?raw` imports — no icon-component runtime, and
// critically, no dynamic filesystem/child_process access at request time
// (astro-icon's default loader shells out to detect installed icon
// collections, which crashes under the real Cloudflare Workers runtime
// `astro dev`/`wrangler dev` run on — confirmed empirically). lucide-static
// and simple-icons both ship one plain .svg file per icon, so there's
// nothing left to resolve once the build has run.
import code from "lucide-static/icons/code.svg?raw";
import graduationCap from "lucide-static/icons/graduation-cap.svg?raw";
import externalLink from "lucide-static/icons/external-link.svg?raw";
import quote from "lucide-static/icons/quote.svg?raw";
import arrowUp from "lucide-static/icons/arrow-up.svg?raw";
import arrowRight from "lucide-static/icons/arrow-right.svg?raw";
import download from "lucide-static/icons/download.svg?raw";
import rss from "lucide-static/icons/rss.svg?raw";
import mail from "lucide-static/icons/mail.svg?raw";
import github from "simple-icons/icons/github.svg?raw";
import x from "simple-icons/icons/x.svg?raw";
import instagram from "simple-icons/icons/instagram.svg?raw";
import facebook from "simple-icons/icons/facebook.svg?raw";

// LinkedIn isn't shipped by either package (simple-icons dropped it at some
// point), so this is hand-authored — same shape (viewBox 0 0 24 24, single
// path) as its simple-icons siblings above.
const linkedin = `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>LinkedIn</title><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;

export const icons = {
  code,
  "graduation-cap": graduationCap,
  "external-link": externalLink,
  quote,
  "arrow-up": arrowUp,
  "arrow-right": arrowRight,
  download,
  rss,
  mail,
  github,
  x,
  instagram,
  facebook,
  linkedin,
} as const;

export type IconName = keyof typeof icons;
