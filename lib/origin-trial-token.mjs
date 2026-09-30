/**
 * Build-time validation for Chrome origin-trial tokens.
 *
 * A token Chrome rejects fails silently: the Origin-Trial header is served,
 * nothing errors, and the feature simply never switches on for visitors. The
 * only place that says why is DevTools → Application → Frames. This decodes a
 * token and reports, in advance, every reason Chrome would reject it on the
 * site's origin, so a bad token breaks the build instead of the feature.
 *
 * Plain .mjs (with JSDoc types) because next.config.mjs imports it.
 */

/**
 * @typedef {object} OriginTrialTokenPayload
 * @property {string} origin       e.g. "https://rajpoot.dev:443"
 * @property {string} feature      the trial name, e.g. "WebMCP"
 * @property {number} expiry       seconds since the epoch
 * @property {boolean} [isSubdomain]  token also covers subdomains of origin
 * @property {boolean} [isThirdParty] token only valid when a cross-origin
 *                                     script injects it
 */

// Token layout (versions 2 and 3): 1 version byte, a 64-byte Ed25519
// signature, a 4-byte big-endian payload length, then the JSON payload.
const SIGNATURE_END = 65;
const PAYLOAD_START = SIGNATURE_END + 4;

/**
 * Decodes a token's payload. Does not verify the signature — that needs
 * Chrome's key and guards against forgery, not against misconfiguration.
 *
 * @param {string} token
 * @returns {OriginTrialTokenPayload}
 */
export function decodeOriginTrialToken(token) {
  const raw = Buffer.from(token, "base64");
  if (raw.length < PAYLOAD_START || (raw[0] !== 2 && raw[0] !== 3)) {
    throw new Error("not an origin-trial token");
  }
  const length = raw.readUInt32BE(SIGNATURE_END);
  if (raw.length !== PAYLOAD_START + length) {
    throw new Error("truncated or padded token");
  }
  return JSON.parse(raw.subarray(PAYLOAD_START).toString("utf8"));
}

/**
 * Every reason Chrome would reject `token` when this site serves it in its own
 * `Origin-Trial` header at `siteUrl`, plus early warning of expiry.
 *
 * @param {string} token
 * @param {{ feature: string, siteUrl: string, now?: number, warnWithinDays?: number }} options
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function checkOriginTrialToken(
  token,
  { feature, siteUrl, now = Date.now(), warnWithinDays = 30 },
) {
  const errors = [];
  const warnings = [];

  let payload;
  try {
    payload = decodeOriginTrialToken(token);
  } catch (error) {
    return {
      errors: [`it can't be decoded (${/** @type {Error} */ (error).message})`],
      warnings,
    };
  }

  if (payload.feature !== feature) {
    errors.push(`it is for the "${payload.feature}" trial, not "${feature}"`);
  }

  // Chrome validates a third-party token only against the origins of the
  // scripts that inject it. Served in the page's own header there is no such
  // script, so it is rejected as WrongOrigin every time, whatever its origin.
  if (payload.isThirdParty) {
    errors.push(
      "it was registered with third-party matching, which Chrome only honours " +
        "when a script from another origin injects the token — served in this " +
        "site's own header it is always rejected. Register a token with " +
        "third-party matching off",
    );
  }

  const site = new URL(siteUrl);
  if (!coversOrigin(payload, site)) {
    errors.push(
      `it is for ${payload.origin}${payload.isSubdomain ? " and its subdomains" : " only"}, ` +
        `which doesn't cover ${site.origin}`,
    );
  }

  const expiresAt = payload.expiry * 1000;
  const date = new Date(expiresAt).toISOString().slice(0, 10);
  if (expiresAt <= now) {
    errors.push(`it expired on ${date}; renew it, or unset the variable`);
  } else if (expiresAt - now < warnWithinDays * 86_400_000) {
    warnings.push(`it expires on ${date}; renew it before then`);
  }

  return { errors, warnings };
}

/**
 * Chrome's own rule: same scheme and port, and the host is the token's host
 * or — for a subdomain token — any subdomain of it.
 *
 * @param {OriginTrialTokenPayload} payload
 * @param {URL} site
 */
function coversOrigin(payload, site) {
  let tokenOrigin;
  try {
    tokenOrigin = new URL(payload.origin);
  } catch {
    return false;
  }
  const port = (url) => url.port || (url.protocol === "https:" ? "443" : "80");
  if (
    tokenOrigin.protocol !== site.protocol ||
    port(tokenOrigin) !== port(site)
  ) {
    return false;
  }
  return (
    site.hostname === tokenOrigin.hostname ||
    (payload.isSubdomain === true &&
      site.hostname.endsWith(`.${tokenOrigin.hostname}`))
  );
}
