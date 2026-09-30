import { afterEach, describe, expect, it, vi } from "vitest";

import {
  checkOriginTrialToken,
  decodeOriginTrialToken,
} from "./origin-trial-token.mjs";
import { siteConfig } from "./seo";
import nextConfig from "@/next.config.mjs";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 8, 30);

/** Builds a token in Chrome's layout, with a dummy signature. */
function makeToken(payload: Record<string, unknown>, version = 3) {
  const json = Buffer.from(JSON.stringify(payload));
  const length = Buffer.alloc(4);
  length.writeUInt32BE(json.length);
  return Buffer.concat([
    Buffer.from([version]),
    Buffer.alloc(64),
    length,
    json,
  ]).toString("base64");
}

const valid = {
  origin: "https://rajpoot.dev:443",
  feature: "WebMCP",
  expiry: (NOW + 180 * DAY) / 1000,
  isSubdomain: true,
};

function check(payload: Record<string, unknown>) {
  return checkOriginTrialToken(makeToken(payload), {
    feature: "WebMCP",
    siteUrl: "https://www.rajpoot.dev",
    now: NOW,
  });
}

describe("decodeOriginTrialToken", () => {
  it("reads the payload of a v2 or v3 token", () => {
    expect(decodeOriginTrialToken(makeToken(valid))).toEqual(valid);
    expect(decodeOriginTrialToken(makeToken(valid, 2))).toEqual(valid);
  });

  it("rejects anything that isn't a whole token", () => {
    expect(() => decodeOriginTrialToken("not-a-token")).toThrow(
      "not an origin-trial token",
    );
    const truncated = makeToken(valid).slice(0, -8);
    expect(() => decodeOriginTrialToken(truncated)).toThrow("truncated");
  });
});

describe("checkOriginTrialToken", () => {
  it("accepts a subdomain token for the apex, which covers www", () => {
    expect(check(valid)).toEqual({ errors: [], warnings: [] });
  });

  it("accepts an exact token for the www origin", () => {
    expect(
      check({ ...valid, origin: "https://www.rajpoot.dev", isSubdomain: false })
        .errors,
    ).toEqual([]);
  });

  it("rejects a third-party token, which Chrome never honours from a header", () => {
    // The token first deployed here: right origin, subdomains on — and
    // WrongOrigin in Chrome on every load because of this one flag.
    const { errors } = check({ ...valid, isThirdParty: true });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("third-party matching");
  });

  it("rejects an apex-only token, which doesn't cover www", () => {
    const { errors } = check({ ...valid, isSubdomain: false });
    expect(errors).toEqual([
      "it is for https://rajpoot.dev:443 only, which doesn't cover https://www.rajpoot.dev",
    ]);
  });

  it("rejects a token for another site, scheme or port", () => {
    for (const origin of [
      "https://notrajpoot.dev",
      "https://example.com",
      "http://rajpoot.dev",
      "https://rajpoot.dev:8443",
      "not a url",
    ]) {
      expect(check({ ...valid, origin }).errors).toHaveLength(1);
    }
  });

  it("rejects a token for a different trial", () => {
    expect(check({ ...valid, feature: "SomethingElse" }).errors).toEqual([
      'it is for the "SomethingElse" trial, not "WebMCP"',
    ]);
  });

  it("rejects an expired token and warns ahead of expiry", () => {
    expect(check({ ...valid, expiry: (NOW - DAY) / 1000 }).errors[0]).toContain(
      "expired on 2026-09-29",
    );
    expect(check({ ...valid, expiry: (NOW + 10 * DAY) / 1000 })).toEqual({
      errors: [],
      warnings: ["it expires on 2026-10-10; renew it before then"],
    });
  });

  it("reports an undecodable token instead of throwing", () => {
    const result = checkOriginTrialToken("garbage", {
      feature: "WebMCP",
      siteUrl: "https://www.rajpoot.dev",
    });
    expect(result.errors).toEqual([
      "it can't be decoded (not an origin-trial token)",
    ]);
  });
});

describe("next.config.mjs Origin-Trial header", () => {
  afterEach(() => vi.unstubAllEnvs());

  const future = (Date.now() + 180 * DAY) / 1000;

  async function originTrialHeader() {
    const rules = await nextConfig.headers!();
    return rules
      .flatMap((rule) => rule.headers)
      .find((header) => header.key === "Origin-Trial")?.value;
  }

  it("is absent when no token is configured", async () => {
    vi.stubEnv("WEBMCP_ORIGIN_TRIAL_TOKEN", "");
    expect(await originTrialHeader()).toBeUndefined();
  });

  it("validates against siteConfig.url and serves every configured token", async () => {
    // An exact-origin token built from siteConfig.url only passes if the
    // config's own site URL still matches it.
    const exact = makeToken({
      origin: new URL(siteConfig.url).origin,
      feature: "WebMCP",
      expiry: future,
    });
    const apex = makeToken({ ...valid, expiry: future });
    vi.stubEnv("WEBMCP_ORIGIN_TRIAL_TOKEN", ` ${exact},\n${apex} `);
    expect(await originTrialHeader()).toBe(`${exact}, ${apex}`);
  });

  it("fails the build, with the reason, for a token Chrome would reject", async () => {
    vi.stubEnv(
      "WEBMCP_ORIGIN_TRIAL_TOKEN",
      makeToken({ ...valid, expiry: future, isThirdParty: true }),
    );
    await expect(nextConfig.headers!()).rejects.toThrow(
      /would be rejected by Chrome on https:\/\/www\.rajpoot\.dev:\n {2}- it was registered with third-party matching/,
    );
  });
});
