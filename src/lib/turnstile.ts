const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileOutcome = { ok: true } | { ok: false; reason: string };

/**
 * Server-side verification of a Turnstile token.
 *
 * Replaces the Upstash sliding-window IP limit the Vercel build used. That
 * limit could only ever count requests — five per IP per ten minutes — which
 * costs a determined spammer one proxy rotation and costs a legitimate visitor
 * behind shared CGNAT their fourth message. Turnstile scores the *client*
 * instead, so it survives IP rotation and stops charging real people for their
 * neighbours' behaviour. It also removes an external database (and its
 * cross-region round trip) from the submit path.
 *
 * With no secret configured this returns ok — the same posture the old code
 * took when the Upstash vars were absent, so local development and E2E don't
 * need a live Cloudflare account. Production must set TURNSTILE_SECRET_KEY;
 * `contact.turnstile_unconfigured` is the signal that it hasn't.
 */
export async function verifyTurnstile(
  secret: string | undefined,
  token: unknown,
  remoteIp: string | null,
): Promise<TurnstileOutcome> {
  if (!secret) return { ok: true };

  if (typeof token !== "string" || token === "") {
    return { ok: false, reason: "missing-input-response" };
  }

  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  let result: { success?: boolean; "error-codes"?: string[] };
  try {
    const response = await fetch(VERIFY_URL, { method: "POST", body });
    result = await response.json();
  } catch {
    // Fail closed: an unreachable siteverify is exactly the condition an
    // attacker would try to manufacture.
    return { ok: false, reason: "verify-unreachable" };
  }

  if (result.success) return { ok: true };
  return {
    ok: false,
    reason: result["error-codes"]?.join(",") || "unknown",
  };
}
