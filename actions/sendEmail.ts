"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { validateString, isValidEmail, getErrorMessage } from "@/lib/utils";
import type { SendEmailResult } from "@/lib/types";
import { logServerEvent } from "@/lib/observability";
import contactFormEmail from "@/email/contact-form-email";
import { emailId, EMAIL_MAX_LENGTH, MESSAGE_MAX_LENGTH } from "@/lib/data";

// Created lazily inside the action's try/catch: the Resend constructor throws
// when RESEND_API_KEY is missing, and at module scope that would crash the
// whole server action (opaque 500) instead of returning the friendly error.
let resendClient: Resend | undefined;

function getResend(): Resend {
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

// Sender shown on the delivered email. Set RESEND_FROM to an address on a
// domain verified in Resend (e.g. "Contact Form <contact@rajpoot.dev>") for
// reliable deliverability; falls back to the Resend sandbox sender otherwise.
const fromAddress =
  process.env.RESEND_FROM || "Contact Form <onboarding@resend.dev>";

const RATE_WINDOW = "10 m" as const;
const RATE_WINDOW_MS = 10 * 60 * 1000;

// Per-IP budget: generous for a human, tight for a script.
const IDENTIFIED_LIMIT = 5;

// Requests that arrive with no usable IP header all share one bucket, so
// applying IDENTIFIED_LIMIT to it would let a single script burn five requests
// and lock out *every other* header-less visitor. They get their own, much
// wider window instead: still bounded, but not a five-request denial of
// service against everyone. On Vercel `x-real-ip` is always present, so this
// is a safety net for other hosts rather than a hot path.
const ANONYMOUS_LIMIT = 50;
const ANONYMOUS_KEY = "anonymous";

// Upstash-backed sliding windows, active when both env vars are set. Created
// lazily (not at module load) so the env is read when the action actually
// runs, which also lets tests exercise this path.
type Limiters = { identified: Ratelimit; anonymous: Ratelimit } | null;

let upstashLimiters: Limiters | undefined;

function getUpstashLimiters(): Limiters {
  if (upstashLimiters === undefined) {
    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      const redis = Redis.fromEnv();
      upstashLimiters = {
        identified: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(IDENTIFIED_LIMIT, RATE_WINDOW),
          prefix: "portfolio:contact",
        }),
        // Separate prefix so the two budgets can never draw down each other.
        anonymous: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(ANONYMOUS_LIMIT, RATE_WINDOW),
          prefix: "portfolio:contact:anon",
        }),
      };
    } else {
      upstashLimiters = null;
    }
  }
  return upstashLimiters;
}

// Best-effort fallback so production never runs with NO rate limit when the
// Upstash env vars are missing: a per-instance sliding window. Serverless
// instances don't share it, so it caps bursts rather than replacing Upstash —
// the warn event below is the signal to fix the configuration.
const fallbackHits = new Map<string, number[]>();
let warnedNoRatelimit = false;

function fallbackLimit(key: string, limit: number): boolean {
  const now = Date.now();
  // Cap the map so a scan across many IPs can't grow memory unboundedly.
  if (fallbackHits.size > 1000) {
    for (const [entry, hits] of fallbackHits) {
      if (hits.every((t) => now - t >= RATE_WINDOW_MS)) {
        fallbackHits.delete(entry);
      }
    }
  }
  const hits = (fallbackHits.get(key) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  );
  const allowed = hits.length < limit;
  if (allowed) hits.push(now);
  fallbackHits.set(key, hits);
  return allowed;
}

type Client = {
  key: string;
  /** False when no trustworthy IP header was present. */
  identified: boolean;
};

async function client(): Promise<Client> {
  const hdrs = await headers();
  // Prefer the platform-trusted header. x-forwarded-for is client-spoofable
  // on its left side, so never trust the first hop — fall back to the LAST
  // entry (the one the trusted proxy appended) only if x-real-ip is absent.
  const ip =
    hdrs.get("x-real-ip")?.trim() ||
    hdrs.get("x-forwarded-for")?.split(",").pop()?.trim();

  return ip
    ? { key: ip, identified: true }
    : { key: ANONYMOUS_KEY, identified: false };
}

const TOO_MANY: SendEmailResult = {
  error: "Too many messages. Please try again in a few minutes.",
};

/** True when the caller is over budget and should be turned away. */
async function isRateLimited(): Promise<boolean> {
  const limiters = getUpstashLimiters();
  const { key, identified } = await client();
  const limit = identified ? IDENTIFIED_LIMIT : ANONYMOUS_LIMIT;

  if (limiters) {
    const limiter = identified ? limiters.identified : limiters.anonymous;
    const { success } = await limiter.limit(key);
    if (!success)
      logServerEvent("contact.rate_limited", "warn", { identified });
    return !success;
  }

  // No Upstash configured. Outside production (and under E2E) there is nothing
  // to protect and throttling would just make tests flaky.
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.E2E_TESTING === "1"
  ) {
    return false;
  }

  if (!warnedNoRatelimit) {
    warnedNoRatelimit = true;
    logServerEvent("contact.ratelimit_misconfigured", "warn", {
      detail:
        "UPSTASH_REDIS_REST_URL/TOKEN are not set — using the per-instance in-memory fallback. Configure Upstash for real protection.",
    });
  }

  const allowed = fallbackLimit(key, limit);
  if (!allowed) logServerEvent("contact.rate_limited", "warn", { identified });
  return !allowed;
}

export const sendEmail = async (
  formData: FormData,
): Promise<SendEmailResult> => {
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

  if (await isRateLimited()) return TOO_MANY;

  // E2E runs (E2E_TESTING=1, set by playwright.config.ts on `next start`) stop
  // here: the whole client → server-action → validation path runs for real,
  // but no email is sent and the fallback limit above is bypassed so repeated
  // test submissions can't throttle each other.
  if (process.env.E2E_TESTING === "1") {
    return { data: { id: "e2e-skipped" } };
  }

  try {
    const { html, text } = contactFormEmail({ message, senderEmail });
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
