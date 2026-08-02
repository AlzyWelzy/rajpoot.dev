import { expect, test } from "@playwright/test";

// The security headers are generated from src/lib/security-headers.js into
// `_headers` (asset responses) and applied by hooks.server.ts (Worker
// responses). They are easy to break silently — nothing in the UI changes when
// a directive is dropped. These assertions are the only thing standing between
// a bad edit and a live regression.
test.describe("security headers", () => {
  // The two serving paths. `/` is answered by Cloudflare's asset server
  // straight from cache and gets its headers from `_headers`; `/resume` is a
  // Worker route and gets them from hooks.server.ts. Both must agree, and two
  // emitters is exactly where a set like this drifts.
  const paths = [
    { label: "asset response", path: "/" },
    { label: "worker response", path: "/resume" },
  ] as const;

  for (const { label, path } of paths) {
    test(`the hardened header set is on the ${label}`, async ({ request }) => {
      const res = await request.get(path);
      const headers = res.headers();

      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["referrer-policy"]).toBe(
        "strict-origin-when-cross-origin",
      );
      expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
      expect(headers["cross-origin-resource-policy"]).toBe("same-origin");
      expect(headers["strict-transport-security"]).toContain("max-age=");
      // includeSubDomains + preload on *every* response is what the Vercel
      // setup could not manage, and what blocked hstspreload.org submission.
      expect(headers["strict-transport-security"]).toContain(
        "includeSubDomains",
      );
      expect(headers["strict-transport-security"]).toContain("preload");
      expect(headers["permissions-policy"]).toContain("geolocation=()");
      // The server must not advertise itself.
      expect(headers["x-powered-by"]).toBeUndefined();
    });

    test(`the CSP closes every unused sink on the ${label}`, async ({
      request,
    }) => {
      const res = await request.get(path);
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
      ]) {
        expect(csp).toContain(directive);
      }
    });
  }

  test("script-src admits only Turnstile and Cloudflare's own beacon", async ({
    request,
  }) => {
    const res = await request.get("/");
    const csp = res.headers()["content-security-policy"];

    const scriptSrc = csp!
      .split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith("script-src"));
    expect(scriptSrc).toBeTruthy();

    const externalOrigins = scriptSrc!
      .split(/\s+/)
      .filter((token) => token.startsWith("http"))
      .sort();
    expect(externalOrigins).toEqual([
      "https://challenges.cloudflare.com",
      "https://static.cloudflareinsights.com",
    ]);
  });

  test("frame-src admits Turnstile and nothing else", async ({ request }) => {
    // This was `frame-src 'none'` while the contact form used an Upstash IP
    // rate limit. Turnstile renders its challenge in an iframe, so the
    // directive had to open — but only to that one origin, and this is the
    // assertion that it stays that narrow.
    const res = await request.get("/");
    const csp = res.headers()["content-security-policy"];

    const frameSrc = csp!
      .split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith("frame-src"));
    expect(frameSrc).toBe("frame-src https://challenges.cloudflare.com");
  });

  test("upgrade-insecure-requests is absent from the E2E build", async ({
    request,
  }) => {
    // Dropping it is what keeps WebKit from rewriting every asset URL to https
    // during these very tests. It must still be present in a production build,
    // which a static `_headers` file cannot decide per host — so that half is
    // asserted in src/lib/security-headers.test.ts instead.
    const res = await request.get("/");
    expect(res.headers()["content-security-policy"]).not.toContain(
      "upgrade-insecure-requests",
    );
  });

  test("cross-site form POSTs to the contact endpoint are rejected", async ({
    request,
  }) => {
    // SvelteKit's built-in CSRF check, verified rather than assumed — it is the
    // app-layer counterpart to `form-action 'self'`.
    const res = await request.post("/api/contact", {
      headers: { origin: "https://evil.example" },
      multipart: { senderEmail: "a@b.co", message: "hi" },
    });
    expect(res.status()).toBe(403);
  });
});

test.describe("redirects", () => {
  const shortlinks = [
    ["/github", "github.com/AlzyWelzy"],
    ["/linkedin", "linkedin.com/in/AlzyWelzy"],
    ["/twitter", "x.com/AlzyWelzy"],
    ["/instagram", "instagram.com/alzywelzyy"],
    ["/facebook", "facebook.com/AlzyWelzyy"],
    ["/blog", "blog.rajpoot.dev"],
  ] as const;

  for (const [path, destination] of shortlinks) {
    test(`${path} permanently redirects off-site`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(308);
      expect(res.headers()["location"]).toContain(destination);
    });

    test(`${path} carries the security headers on the redirect itself`, async ({
      request,
    }) => {
      // The regression this guards against is specific and was live on Vercel:
      // Next applied neither `headers()` nor the CSP to a redirect response, so
      // every shortlink hop shipped bare.
      const res = await request.get(path, { maxRedirects: 0 });
      const headers = res.headers();
      expect(headers["content-security-policy"]).toBeTruthy();
      expect(headers["strict-transport-security"]).toContain("preload");
    });
  }

  test("/blog/:path keeps the sub-path when forwarding", async ({
    request,
  }) => {
    const res = await request.get("/blog/some-post", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()["location"]).toBe(
      "https://blog.rajpoot.dev/some-post",
    );
  });
});
