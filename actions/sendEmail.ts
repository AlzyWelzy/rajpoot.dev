"use server";

import React from "react";
import { headers } from "next/headers";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { validateString, getErrorMessage } from "@/lib/utils";
import ContactFormEmail from "@/email/contact-form-email";
import { emailId } from "@/lib/data";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  if (ratelimit) {
    const hdrs = await headers();
    const ip =
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      hdrs.get("x-real-ip") ||
      "anonymous";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return {
        error: "Too many messages. Please try again in a few minutes.",
      };
    }
  }

  if (!validateString(senderEmail, 500)) {
    return { error: "Invalid sender email" };
  }
  if (!validateString(message, 5000)) {
    return { error: "Invalid message" };
  }

  try {
    const data = await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: emailId,
      subject: "Message from contact form",
      replyTo: senderEmail,
      react: React.createElement(ContactFormEmail, { message, senderEmail }),
    });
    return { data };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
};
