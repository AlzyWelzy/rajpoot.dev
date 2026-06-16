"use server";

import React from "react";
import { headers } from "next/headers";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { validateString, isValidEmail, getErrorMessage } from "@/lib/utils";
import ContactFormEmail from "@/email/contact-form-email";
import { emailId } from "@/lib/data";

const resend = new Resend(process.env.RESEND_API_KEY);

// Sender shown on the delivered email. Set RESEND_FROM to an address on a
// domain verified in Resend (e.g. "Contact Form <contact@rajpoot.dev>") for
// reliable deliverability; falls back to the Resend sandbox sender otherwise.
const fromAddress =
  process.env.RESEND_FROM || "Contact Form <onboarding@resend.dev>";

// IP rate limiting is opt-in: it only activates when the Upstash env vars are
// set. Without them the honeypot remains the spam guard and nothing errors.
const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(5, "10 m"),
        prefix: "portfolio:contact",
      })
    : null;

export const sendEmail = async (formData: FormData) => {
  const senderEmail = formData.get("senderEmail");
  const message = formData.get("message");
  const honeypot = formData.get("contact_reason_hp");

  // Spam bots fill the hidden honeypot field. Pretend success without sending
  // so we don't tip them off.
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return { data: { id: "skipped" } };
  }

  // Validate first (cheap, synchronous) so malformed payloads don't spend a
  // rate-limit token a legitimate user might need.
  if (!validateString(senderEmail, 500) || !isValidEmail(senderEmail)) {
    return { error: "Invalid sender email" };
  }
  if (!validateString(message, 5000)) {
    return { error: "Invalid message" };
  }

  if (ratelimit) {
    const hdrs = await headers();
    // Prefer the platform-trusted header. x-forwarded-for is client-spoofable
    // on its left side, so never trust the first hop — fall back to the LAST
    // entry (the one the trusted proxy appended) only if x-real-ip is absent.
    const ip =
      hdrs.get("x-real-ip")?.trim() ||
      hdrs.get("x-forwarded-for")?.split(",").pop()?.trim() ||
      "anonymous";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return {
        error: "Too many messages. Please try again in a few minutes.",
      };
    }
  }

  try {
    const data = await resend.emails.send({
      from: fromAddress,
      to: emailId,
      subject: "Message from contact form",
      replyTo: senderEmail,
      react: React.createElement(ContactFormEmail, { message, senderEmail }),
    });
    return { data };
  } catch (error: unknown) {
    // Log the real cause server-side; return a generic message so raw SDK/infra
    // error text never reaches the client.
    console.error("Contact form send failed:", getErrorMessage(error));
    return {
      error: "Couldn't send your message. Please try again later.",
    };
  }
};
