import { json } from "@sveltejs/kit";
import { Resend } from "resend";

import { env } from "$env/dynamic/private";
import contactFormEmail from "$lib/email/contact-form-email";
import { emailId, EMAIL_MAX_LENGTH, MESSAGE_MAX_LENGTH } from "$lib/data";
import { logServerEvent } from "$lib/observability";
import { verifyTurnstile } from "$lib/turnstile";
import type { SendEmailResult } from "$lib/types";
import { getErrorMessage, isValidEmail, validateString } from "$lib/utils";

import type { RequestHandler } from "./$types";

// The one route on the site that is not static.
export const prerender = false;

/**
 * Sender shown on the delivered email. Set RESEND_FROM to an address on a
 * domain verified in Resend (e.g. "Contact Form <contact@rajpoot.dev>") for
 * reliable deliverability; falls back to the Resend sandbox sender otherwise.
 */
function fromAddress(): string {
  return env.RESEND_FROM || "Contact Form <onboarding@resend.dev>";
}

let warnedNoTurnstile = false;

export const POST: RequestHandler = async ({ request }) => {
  const formData = await request.formData();
  const senderEmail = formData.get("senderEmail");
  const message = formData.get("message");
  const honeypot = formData.get("contact_reason_hp");

  // Spam bots fill the hidden honeypot field. Pretend success without sending
  // so we don't tip them off. Checked before Turnstile because it is free and
  // catches the indiscriminate form-fillers without spending a verify call.
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    logServerEvent("contact.honeypot_tripped", "warn");
    return json({ data: { id: "skipped" } } satisfies SendEmailResult);
  }

  // Validate first (cheap, synchronous) so malformed payloads don't spend a
  // Turnstile verification round trip.
  if (
    !validateString(senderEmail, EMAIL_MAX_LENGTH) ||
    !isValidEmail(senderEmail)
  ) {
    return json({ error: "Invalid sender email" } satisfies SendEmailResult, {
      status: 400,
    });
  }
  if (!validateString(message, MESSAGE_MAX_LENGTH)) {
    return json({ error: "Invalid message" } satisfies SendEmailResult, {
      status: 400,
    });
  }

  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret && !warnedNoTurnstile) {
    warnedNoTurnstile = true;
    logServerEvent("contact.turnstile_unconfigured", "warn", {
      detail:
        "TURNSTILE_SECRET_KEY is not set — the contact form is accepting unverified submissions. Set it with `wrangler secret put TURNSTILE_SECRET_KEY`.",
    });
  }

  const verdict = await verifyTurnstile(
    secret,
    formData.get("cf-turnstile-response"),
    // Cloudflare's own header, set at the edge and not client-spoofable.
    request.headers.get("cf-connecting-ip"),
  );
  if (!verdict.ok) {
    logServerEvent("contact.turnstile_failed", "warn", {
      reason: verdict.reason,
    });
    return json(
      {
        error: "Couldn't verify that you're human. Please try again.",
      } satisfies SendEmailResult,
      { status: 403 },
    );
  }

  // E2E runs stop here: the whole client → endpoint → validation path runs for
  // real, but no email is sent.
  if (env.E2E_TESTING === "1") {
    return json({ data: { id: "e2e-skipped" } } satisfies SendEmailResult);
  }

  try {
    const { html, text } = contactFormEmail({ message, senderEmail });
    const data = await new Resend(env.RESEND_API_KEY).emails.send({
      from: fromAddress(),
      to: emailId,
      subject: "Message from contact form",
      replyTo: senderEmail,
      html,
      // A real text/plain alternative alongside the HTML part — transactional
      // mail without one scores worse with spam filters.
      text,
    });
    return json({ data } satisfies SendEmailResult);
  } catch (error: unknown) {
    // Log the real cause server-side; return a generic message so raw SDK/infra
    // error text never reaches the client. No message body or sender address in
    // the log line — this is the one path a log drain alerts on.
    logServerEvent("contact.send_failed", "error", {
      reason: getErrorMessage(error),
    });
    return json(
      {
        error: "Couldn't send your message. Please try again later.",
      } satisfies SendEmailResult,
      { status: 502 },
    );
  }
};
