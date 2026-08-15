// Project logos are inlined into the page as data URIs rather than served
// from public/. Three separate SVG files cost three requests that the
// browser could only discover after the HTML had parsed (~717ms into the
// load, measured), for ~1.4 KB of body plus request overhead. Folded into
// the document they compress against the surrounding markup and cost ~0.7 KB
// — a net saving *and* three fewer requests.
//
// Kept as `<img src="data:…">` rather than inline <svg> deliberately: the
// two are within ~70 bytes of each other after brotli, and this way the
// `alt` text, `loading` and `decoding` attributes keep working exactly as
// before, with no `role="img"`/`<title>` accessibility rewrite.
import cloudtechtiq from "@/assets/logos/cloudtechtiq-logo.svg?raw";
import namecheapSdk from "@/assets/logos/namecheap-sdk-logo.svg?raw";
import rosterly from "@/assets/logos/rosterly-logo.svg?raw";

/**
 * Percent-encodes only what a `data:` URL cannot carry literally. Encoding
 * the whole string (encodeURIComponent) would escape every space, slash and
 * equals sign in the markup and roughly double its length for no benefit.
 */
function toDataUri(svg: string): string {
  const compact = svg.replace(/\s+/g, " ").trim();
  const escaped = compact
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/"/g, "%22")
    .replace(/&/g, "%26");
  return `data:image/svg+xml,${escaped}`;
}

/** Keyed by the `logo` identifier used in `data.ts`. */
export const logos = {
  cloudtechtiq: toDataUri(cloudtechtiq),
  "namecheap-sdk": toDataUri(namecheapSdk),
  rosterly: toDataUri(rosterly),
} as const;

export type LogoName = keyof typeof logos;
