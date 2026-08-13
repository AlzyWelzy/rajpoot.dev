import { expect, test } from "@playwright/test";

// The security headers are defined in public/_headers and are easy to break
// silently — nothing in the UI changes when a directive is dropped. These
// assertions are the only thing standing between a bad edit and a live
// regression.
test.describe("security headers", () => {
  test("the homepage ships the hardened header set", async ({ request }) => {
    const res = await request.get("/");
    const headers = res.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
    expect(headers["cross-origin-resource-policy"]).toBe("same-origin");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["permissions-policy"]).toContain("geolocation=()");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("the CSP closes every sink the site does not use", async ({
    request,
  }) => {
    const res = await request.get("/");
    const csp = res.headers()["content-security-policy"];
    expect(csp).toBeTruthy();

    for (const directive of [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "worker-src 'none'",
      "media-src 'none'",
      // Open only for Turnstile's own challenge iframe — everything else
      // still can't be framed in.
      "frame-src https://challenges.cloudflare.com",
    ]) {
      expect(csp).toContain(directive);
    }

    // No external script origin beyond Cloudflare's analytics beacon and
    // Turnstile's widget script.
    const scriptSrc = csp!
      .split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith("script-src"));
    expect(scriptSrc).toBeTruthy();
    const externalOrigins = scriptSrc!
      .split(/\s+/)
      .filter((token) => token.startsWith("http"));
    expect(externalOrigins).toEqual([
      "https://static.cloudflareinsights.com",
      "https://challenges.cloudflare.com",
    ]);
  });

  test("upgrade-insecure-requests is never set", async ({ request }) => {
    // Deliberately omitted (see public/_headers): every directive already
    // allows only 'self' or explicit https:// origins, so there is no http:
    // source this policy could ever request — the directive would be pure
    // redundancy, and dropping it sidesteps WebKit rewriting asset URLs to
    // https even on localhost.
    const res = await request.get("/");
    expect(res.headers()["content-security-policy"]).not.toContain(
      "upgrade-insecure-requests",
    );
  });
});

test.describe("redirects", () => {
  const shortlinks = [
    ["/github", "github.com/AlzyWelzy"],
    ["/linkedin", "linkedin.com/in/AlzyWelzy"],
    ["/blog", "blog.rajpoot.dev"],
  ] as const;

  for (const [path, destination] of shortlinks) {
    test(`${path} permanently redirects off-site`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(301);
      expect(res.headers()["location"]).toContain(destination);
    });
  }
});
