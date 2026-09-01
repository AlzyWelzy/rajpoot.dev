"use server";

import { headers } from "next/headers";
import { Resend } from "resend";

import { validateString, isValidEmail, getErrorMessage } from "@/lib/utils";
import type { SendEmailResult } from "@/lib/types";
import { logServerEvent } from "@/lib/observability";
import contactFormEmail from "@/email/contact-form-email";
import visitorConfirmationEmail from "@/email/visitor-confirmation-email";
import {
  emailId,
  NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  TURNSTILE_ACTION,
} from "@/lib/data";
import { siteConfig } from "@/lib/seo";

// Created lazily inside the action's try/catch: the Resend constructor throws
// when RESEND_API_KEY is missing, and at module scope that would crash the
// whole server action (opaque 500) instead of returning the friendly error.
let resendClient: Resend | undefined;

function getResend(): Resend {
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

// Sender shown on the notification email to the site owner. Set RESEND_FROM to
// an address on a domain verified in Resend for reliable deliverability; falls
// back to the production sender so the form works without local configuration.
const fromAddress = process.env.RESEND_FROM || "Website <hello@rajpoot.dev>";

// Sender shown on the confirmation email to the visitor. The address is the
// same Resend-verified sender, but with a personal display name so the reply
// feels human. This is not a secret and does not need an env var.
const confirmationFromAddress = "Manvendra <hello@rajpoot.dev>";

// Hostnames Turnstile's siteverify response must match. Defaults to this
// site's own host (both bare and www-prefixed, since either could be live)
// plus localhost/127.0.0.1 for local dev and E2E. Override with a
// comma-separated TURNSTILE_HOSTNAMES if a deploy needs something specific —
// Vercel preview deployments get a generated *.vercel.app hostname, so those
// need either this override or the domain added to the widget.
function getExpectedHostnames(): Set<string> {
  if (process.env.TURNSTILE_HOSTNAMES) {
    return new Set(
      process.env.TURNSTILE_HOSTNAMES.split(",")
        .map((h) => h.trim())
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
  // Testing-key responses always report a fixed hostname and no action,
  // regardless of the real page — so those two checks only make sense for a
  // real widget/token.
  metadata?: { result_with_testing_key?: boolean };
};

/**
 * Client IP forwarded to siteverify so Turnstile can factor it into its risk
 * decision. Not required for verification to succeed — just extra signal.
 * `x-forwarded-for` is spoofable on its left side, so never trust the first
 * hop; take the last entry, which the trusted proxy appended.
 */
async function connectingIp(): Promise<string | undefined> {
  const hdrs = await headers();
  return (
    hdrs.get("cf-connecting-ip")?.trim() ||
    hdrs.get("x-real-ip")?.trim() ||
    hdrs.get("x-forwarded-for")?.split(",").pop()?.trim()
  );
}

/** True when the Turnstile token is missing, invalid, or fails verification. */
async function turnstileFailed(
  token: FormDataEntryValue | null,
): Promise<boolean> {
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return true;
  }

  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) {
    logServerEvent("contact.turnstile_misconfigured", "warn", {
      detail:
        "TURNSTILE_SECRET is not set — every submission will fail verification.",
    });
    return true;
  }

  try {
    const remoteip = await connectingIp();
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

export const sendEmail = async (
  formData: FormData,
): Promise<SendEmailResult> => {
  const senderName = formData.get("senderName");
  const senderEmail = formData.get("senderEmail");
  const message = formData.get("message");
  const honeypot = formData.get("contact_reason_hp");

  // Spam bots fill the hidden honeypot field. Pretend success without sending
  // so we don't tip them off.
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    logServerEvent("contact.honeypot_tripped", "warn");
    return { data: { id: "skipped" } };
  }

  // Validate first (cheap, synchronous) so malformed payloads don't spend a
  // siteverify round trip.
  if (!validateString(senderName, NAME_MAX_LENGTH)) {
    return { error: "Invalid sender name" };
  }
  if (
    !validateString(senderEmail, EMAIL_MAX_LENGTH) ||
    !isValidEmail(senderEmail)
  ) {
    return { error: "Invalid sender email" };
  }
  if (!validateString(message, MESSAGE_MAX_LENGTH)) {
    return { error: "Invalid message" };
  }

  // Turnstile is the sole gate — there is deliberately no numeric rate limit
  // any more. A proof-of-humanity check per submission is a better fit than
  // an IP budget for a personal contact form: it stops scripted abuse without
  // an external Redis dependency, and without penalising several genuine
  // visitors who happen to share a NAT'd address.
  if (await turnstileFailed(formData.get("cf-turnstile-response"))) {
    return { error: "Verification failed. Please try again." };
  }

  // E2E runs (E2E_TESTING=1, set by playwright.config.ts on `next start`) stop
  // here: the whole client → server-action → validation → Turnstile path runs
  // for real, but no email is sent.
  if (process.env.E2E_TESTING === "1") {
    return { data: { id: "e2e-skipped" } };
  }

  try {
    const { html, text } = contactFormEmail({
      message,
      senderEmail,
      senderName: senderName as string,
    });
    const data = await getResend().emails.send({
      from: fromAddress,
      to: emailId,
      subject: "Message from contact form",
      replyTo: senderEmail,
      html,
      // A real text/plain alternative alongside the HTML part — transactional
      // mail without one scores worse with spam filters.
      text,
    });

    // Confirmation to the visitor: fire-and-forget. If it fails, the visitor's
    // message *was* delivered to the owner, so the user still sees success.
    // hello@rajpoot.dev is a Resend-only sender with no mailbox; replyTo
    // points replies to the real Zoho mailbox (manvendra@rajpoot.dev).
    try {
      const confirmation = visitorConfirmationEmail({
        message,
        senderEmail,
        senderName: senderName as string,
      });
      await getResend().emails.send({
        from: confirmationFromAddress,
        to: senderEmail,
        subject: "Thanks for reaching out \u2014 Manvendra Rajpoot",
        replyTo: emailId,
        html: confirmation.html,
        text: confirmation.text,
      });
    } catch (confirmError: unknown) {
      logServerEvent("contact.confirmation_failed", "error", {
        reason: getErrorMessage(confirmError),
      });
    }

    return { data };
  } catch (error: unknown) {
    // Log the real cause server-side; return a generic message so raw SDK/infra
    // error text never reaches the client. No message body or sender address
    // in the log line — this is the one path a log drain alerts on.
    logServerEvent("contact.send_failed", "error", {
      reason: getErrorMessage(error),
    });
    return {
      error: "Couldn't send your message. Please try again later.",
    };
  }
};
