import { env } from "cloudflare:workers";
import { Resend } from "resend";

import { validateString, isValidEmail, getErrorMessage } from "@/lib/utils";
import { logServerEvent } from "@/lib/observability";
import contactFormEmail from "@/email/contact-form-email";
import {
  emailId,
  EMAIL_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  TURNSTILE_ACTION,
} from "@/lib/data";
import { siteConfig } from "@/lib/seo";

/**
 * The contact form's core logic, kept as a plain function separate from
 * `src/actions/index.ts`'s `defineAction` wrapper so it can be unit tested
 * directly — Astro Actions run through request-scoped machinery that isn't
 * meant to be invoked outside a real request.
 */
export type ContactResult =
  | { data: unknown; error?: undefined; code?: undefined }
  | {
      error: string;
      code: "BAD_REQUEST" | "FORBIDDEN" | "INTERNAL_SERVER_ERROR";
      data?: undefined;
    };

// Sender shown on the delivered email. Set RESEND_FROM to an address on a
// domain verified in Resend (e.g. "Contact Form <contact@rajpoot.dev>") for
// reliable deliverability; falls back to the Resend sandbox sender otherwise.
function getFromAddress(): string {
  return env.RESEND_FROM || "Contact Form <onboarding@resend.dev>";
}

// Hostnames Turnstile's siteverify response must match. Defaults to the
// current site's own host (both bare and www-prefixed, since either could
// be live) plus localhost/127.0.0.1 for local dev and E2E — Cloudflare's
// testing sitekey/secret pair reports "localhost" as the hostname, same as
// the widget's own dashboard-registered domain list. Override with a
// comma-separated TURNSTILE_HOSTNAMES if a deploy ever needs something more
// specific.
function getExpectedHostnames(): Set<string> {
  if (env.TURNSTILE_HOSTNAMES) {
    return new Set(
      env.TURNSTILE_HOSTNAMES.split(",")
        .map((h: string) => h.trim())
        .filter(Boolean),
    );
  }
  const host = new URL(siteConfig.url).host;
  const bare = host.replace(/^www\./, "");
  return new Set([bare, `www.${bare}`, "localhost", "127.0.0.1"]);
}

type SiteverifyResponse = {
  success: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
  // Set by Cloudflare when the request used a testing sitekey/secret pair.
  // Testing-key responses always report a fixed hostname ("example.com")
  // and no action, regardless of the real page — so those two checks only
  // make sense for a real widget/token.
  metadata?: { result_with_testing_key?: boolean };
};

/**
 * Cloudflare's trusted client-IP header, forwarded to siteverify so Turnstile
 * can factor it into its risk decision. Not required for verification to
 * succeed — just extra signal.
 */
function connectingIp(request: Request): string | undefined {
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",").pop()?.trim()
  );
}

/** True when the Turnstile token is missing, invalid, or fails verification. */
async function turnstileFailed(
  token: FormDataEntryValue | null,
  request: Request,
): Promise<boolean> {
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return true;
  }

  const secret = env.TURNSTILE_SECRET;
  if (!secret) {
    logServerEvent("contact.turnstile_misconfigured", "warn", {
      detail:
        "TURNSTILE_SECRET is not set — every submission will fail verification.",
    });
    return true;
  }

  try {
    const remoteip = connectingIp(request);
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: AbortSignal.timeout(10_000),
        body: new URLSearchParams({
          secret,
          response: token,
          ...(remoteip ? { remoteip } : {}),
        }),
      },
    );
    if (!res.ok) throw new Error(`siteverify responded ${res.status}`);
    const result = (await res.json()) as SiteverifyResponse;

    const isTestingKey = result.metadata?.result_with_testing_key === true;
    const rejected =
      !result.success ||
      (!isTestingKey &&
        (result.action !== TURNSTILE_ACTION ||
          !result.hostname ||
          !getExpectedHostnames().has(result.hostname)));

    if (rejected) {
      logServerEvent("contact.turnstile_rejected", "warn", {
        detail: (result["error-codes"] ?? []).join(",") || "no error code",
      });
      return true;
    }
    return false;
  } catch (error: unknown) {
    // Network error, timeout, or non-JSON body from siteverify. Fail closed.
    logServerEvent("contact.turnstile_error", "error", {
      reason: getErrorMessage(error),
    });
    return true;
  }
}

export async function submitContactForm(
  formData: FormData,
  request: Request,
): Promise<ContactResult> {
  const senderEmail = formData.get("senderEmail");
  const message = formData.get("message");
  const honeypot = formData.get("contact_reason_hp");

  // Spam bots fill the hidden honeypot field. Pretend success without
  // sending so we don't tip them off.
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    logServerEvent("contact.honeypot_tripped", "warn");
    return { data: { id: "skipped" } };
  }

  // Validate first (cheap, synchronous) so malformed payloads don't spend a
  // siteverify round trip.
  if (
    !validateString(senderEmail, EMAIL_MAX_LENGTH) ||
    !isValidEmail(senderEmail)
  ) {
    return { error: "Invalid sender email", code: "BAD_REQUEST" };
  }
  if (!validateString(message, MESSAGE_MAX_LENGTH)) {
    return { error: "Invalid message", code: "BAD_REQUEST" };
  }

  if (await turnstileFailed(formData.get("cf-turnstile-response"), request)) {
    return {
      error: "Verification failed. Please try again.",
      code: "FORBIDDEN",
    };
  }

  // E2E runs (E2E_TESTING=1, set by playwright.config.ts) stop here: the
  // whole client → Action → validation path runs for real, including a real
  // Turnstile round trip against Cloudflare's testing sitekey/secret pair —
  // but no email is sent.
  if (env.E2E_TESTING === "1") {
    return { data: { id: "e2e-skipped" } };
  }

  try {
    const { html, text } = contactFormEmail({ message, senderEmail });
    const resend = new Resend(env.RESEND_API_KEY);
    const data = await resend.emails.send({
      from: getFromAddress(),
      to: emailId,
      subject: "Message from contact form",
      replyTo: senderEmail,
      html,
      // A real text/plain alternative alongside the HTML part —
      // transactional mail without one scores worse with spam filters.
      text,
    });
    return { data };
  } catch (error: unknown) {
    // Log the real cause server-side; return a generic message so raw
    // SDK/infra error text never reaches the client. No message body or
    // sender address in the log line — this is the one path a log drain
    // alerts on.
    logServerEvent("contact.send_failed", "error", {
      reason: getErrorMessage(error),
    });
    return {
      error: "Couldn't send your message. Please try again later.",
      code: "INTERNAL_SERVER_ERROR",
    };
  }
}
