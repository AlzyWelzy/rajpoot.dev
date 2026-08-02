import { siteConfig } from "./seo";

/**
 * Vanity shortlinks. `/linkedin` and friends are printed on a CV and pasted
 * into places that outlive any one social profile, so the destination has to be
 * changeable in one place — here.
 *
 * These were `redirects()` entries in next.config.mjs. They are answered by
 * hooks.server.ts now, which matters for more than tidiness: on Vercel, Next
 * applied **neither `headers()` nor the CSP** to a redirect response, so every
 * one of these hops shipped bare. A Worker response is a Worker response, so
 * they now carry the full security header set like any other.
 */
export const SHORTLINKS: Record<string, string> = {
  "/linkedin": siteConfig.linkedin,
  "/github": siteConfig.github,
  "/twitter": siteConfig.twitterUrl,
  "/instagram": siteConfig.instagram,
  "/facebook": siteConfig.facebook,
  "/esyconnect": "https://esyconnect.com/candidate/alzywelzy/",
  // The blog lives on its own subdomain; /blog and any sub-path go there.
  "/blog": siteConfig.blog,
};

/**
 * Resolves a pathname to its redirect destination, or null if it isn't a
 * shortlink. Trailing slashes are tolerated so /github/ behaves like /github.
 */
export function resolveShortlink(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  const direct = SHORTLINKS[path];
  if (direct) return direct;

  // /blog/:path* keeps the sub-path when forwarding to the blog subdomain.
  if (path.startsWith("/blog/")) {
    return `${siteConfig.blog}${path.slice("/blog".length)}`;
  }

  return null;
}
