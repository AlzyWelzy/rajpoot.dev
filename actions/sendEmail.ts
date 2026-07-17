"use server";

import React from "react";
import { headers } from "next/headers";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { validateString, isValidEmail, getErrorMessage } from "@/lib/utils";
import ContactFormEmail from "@/email/contact-form-email";
import { emailId, EMAIL_MAX_LENGTH, MESSAGE_MAX_LENGTH } from "@/lib/data";

const resend = new Resend(process.env.RESEND_API_KEY);

// Sender shown on the delivered email. Set RESEND_FROM to an address on a
// domain verified in Resend (e.g. "Contact Form <contact@rajpoot.dev>") for
// reliable deliverability; falls back to the Resend sandbox sender otherwise.
const fromAddress =
  process.env.RESEND_FROM || "Contact Form <onboarding@resend.dev>";

// Upstash-backed sliding window, active when both env vars are set. Created
// lazily (not at module load) so the env is read when the action actually
// runs, which also lets tests exercise this path.
let upstashLimiter: Ratelimit | null | undefined;

function getUpstashLimiter(): Ratelimit | null {
  if (upstashLimiter === undefined) {
    upstashLimiter =
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
        ? new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(5, "10 m"),
            prefix: "portfolio:contact",
          })
        : null;
  }
  return upstashLimiter;
}

// Best-effort fallback so production never runs with NO rate limit when the
// Upstash env vars are missing: a per-instance sliding window. Serverless
// instances don't share it, so it caps bursts rather than replacing Upstash —
// the console.warn below is the signal to fix the configuration.
const FALLBACK_LIMIT = 5;
const FALLBACK_WINDOW_MS = 10 * 60 * 1000;
const fallbackHits = new Map<string, number[]>();
let warnedNoRatelimit = false;

function fallbackLimit(ip: string): boolean {
  const now = Date.now();
  // Cap the map so a scan across many IPs can't grow memory unboundedly.
  if (fallbackHits.size > 1000) {
    for (const [key, hits] of fallbackHits) {
      if (hits.every((t) => now - t >= FALLBACK_WINDOW_MS)) {
        fallbackHits.delete(key);
      }
    }
  }
  const hits = (fallbackHits.get(ip) ?? []).filter(
    (t) => now - t < FALLBACK_WINDOW_MS,
  );
  const allowed = hits.length < FALLBACK_LIMIT;
  if (allowed) hits.push(now);
  fallbackHits.set(ip, hits);
  return allowed;
}

async function clientIp(): Promise<string> {
  const hdrs = await headers();
  // Prefer the platform-trusted header. x-forwarded-for is client-spoofable
  // on its left side, so never trust the first hop — fall back to the LAST
  // entry (the one the trusted proxy appended) only if x-real-ip is absent.
  return (
    hdrs.get("x-real-ip")?.trim() ||
    hdrs.get("x-forwarded-for")?.split(",").pop()?.trim() ||
    "anonymous"
  );
}

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
  if (
    !validateString(senderEmail, EMAIL_MAX_LENGTH) ||
    !isValidEmail(senderEmail)
  ) {
    return { error: "Invalid sender email" };
  }
  if (!validateString(message, MESSAGE_MAX_LENGTH)) {
    return { error: "Invalid message" };
  }

  const limiter = getUpstashLimiter();
  if (limiter) {
    const { success } = await limiter.limit(await clientIp());
    if (!success) {
      return {
        error: "Too many messages. Please try again in a few minutes.",
      };
    }
  } else if (process.env.NODE_ENV === "production") {
    if (!warnedNoRatelimit) {
      warnedNoRatelimit = true;
      console.warn(
        "Contact form: UPSTASH_REDIS_REST_URL/TOKEN are not set — using the per-instance in-memory fallback rate limit. Configure Upstash for real protection.",
      );
    }
    if (!fallbackLimit(await clientIp())) {
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
