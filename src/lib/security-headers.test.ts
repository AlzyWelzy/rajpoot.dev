import { describe, expect, it } from "vitest";

import {
  contentSecurityPolicy,
  isLocalHost,
  renderHeadersFile,
  securityHeaders,
} from "./security-headers.js";

const directives = (csp: string) =>
  csp.split(";").map((d) => d.trim().replace(/\s+/g, " "));

describe("contentSecurityPolicy", () => {
  const csp = contentSecurityPolicy({ upgradeInsecure: true });

  it("closes every sink the site does not use", () => {
    for (const directive of [
      "object-src 'none'",
      "worker-src 'none'",
      "media-src 'none'",
      "frame-ancestors 'none'",
    ]) {
      expect(directives(csp)).toContain(directive);
    }
  });

  it("locks the origin-scoped directives to self", () => {
    for (const directive of [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "manifest-src 'self'",
    ]) {
      expect(directives(csp)).toContain(directive);
    }
  });

  it("admits no script origin beyond Turnstile and Cloudflare's beacon", () => {
    const scriptSrc = directives(csp).find((d) => d.startsWith("script-src"));
    const origins = scriptSrc!
      .split(" ")
      .filter((t) => t.startsWith("http"))
      .sort();
    expect(origins).toEqual([
      "https://challenges.cloudflare.com",
      "https://static.cloudflareinsights.com",
    ]);
  });

  it("opens frame-src to Turnstile only", () => {
    // Turnstile is the sole reason this isn't 'none'. If the contact form ever
    // stops using it, this goes straight back to 'none'.
    expect(directives(csp)).toContain(
      "frame-src https://challenges.cloudflare.com",
    );
  });

  it("emits upgrade-insecure-requests only when asked", () => {
    expect(csp).toContain("upgrade-insecure-requests");
    expect(contentSecurityPolicy({ upgradeInsecure: false })).not.toContain(
      "upgrade-insecure-requests",
    );
  });
});

describe("securityHeaders", () => {
  const headers = securityHeaders({ upgradeInsecure: true });

  it("ships an HSTS value that qualifies for preload submission", () => {
    // The Vercel setup could not manage this on the apex → www hop, which is
    // precisely why the domain was never submittable. All three parts are
    // required by hstspreload.org.
    const hsts = headers["Strict-Transport-Security"]!;
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).toContain("preload");
    const maxAge = Number(hsts.match(/max-age=(\d+)/)?.[1]);
    expect(maxAge).toBeGreaterThanOrEqual(31536000);
  });

  it("keeps the non-CSP hardening headers", () => {
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(headers["Cross-Origin-Resource-Policy"]).toBe("same-origin");
    expect(headers["Permissions-Policy"]).toContain("geolocation=()");
  });
});

describe("isLocalHost", () => {
  it("recognises the hosts Playwright serves from", () => {
    expect(isLocalHost("localhost")).toBe(true);
    expect(isLocalHost("127.0.0.1")).toBe(true);
  });

  it("treats every real host as remote", () => {
    expect(isLocalHost("www.rajpoot.dev")).toBe(false);
    expect(isLocalHost("rajpoot.dev")).toBe(false);
  });
});

describe("renderHeadersFile", () => {
  // This is the half of the header story the E2E suite cannot cover. `_headers`
  // is a static file, so `upgrade-insecure-requests` is decided at build time
  // and the E2E build deliberately omits it (WebKit would apply it to localhost
  // and break every asset load). These assertions are what stand in for that
  // missing coverage — they describe what actually ships to production.
  const file = renderHeadersFile({ upgradeInsecure: true });

  it("applies the whole set to every path", () => {
    expect(file).toMatch(/^\/\*$/m);
    for (const name of Object.keys(
      securityHeaders({ upgradeInsecure: true }),
    )) {
      expect(file).toContain(`  ${name}: `);
    }
  });

  it("includes upgrade-insecure-requests in a production build", () => {
    expect(file).toContain("upgrade-insecure-requests");
    expect(renderHeadersFile({ upgradeInsecure: false })).not.toContain(
      "upgrade-insecure-requests",
    );
  });

  it("noindexes the raw PDF filenames", () => {
    // The documents are reachable both at /resume and at their bare filename in
    // static/. The route handler covers the first; only this rule covers the
    // second, and without it the standalone PDFs compete with the homepage in
    // search results.
    expect(file).toContain("/*.pdf");
    expect(file).toMatch(/\/\*\.pdf\n\s+X-Robots-Tag: noindex/);
  });

  it("puts every rule on its own indented line", () => {
    // Cloudflare parses `_headers` line by line: a header that lost its
    // indentation is silently read as a new path pattern instead.
    const lines = file.split("\n").filter((l) => l.includes(": "));
    for (const line of lines) {
      if (line.startsWith("#")) continue;
      expect(line).toMatch(/^ {2}\S+: /);
    }
  });
});
