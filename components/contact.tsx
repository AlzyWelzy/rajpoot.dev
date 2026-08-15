"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { m } from "motion/react";
import { track } from "@vercel/analytics";
import toast from "react-hot-toast";

import SectionHeading from "./section-heading";
import SubmitBtn from "./submit-btn";
import { useSectionInView } from "@/lib/hooks";
import { sendEmail } from "@/actions/sendEmail";
import {
  emailId,
  EMAIL_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  TURNSTILE_SITE_KEY,
  TURNSTILE_ACTION,
} from "@/lib/data";

declare global {
  interface Window {
    // Only the one call this component needs; the full Turnstile API
    // surface is much larger.
    turnstile?: { reset: (widgetIdOrContainer?: string) => void };
  }
}

type FormState = { error?: string; success?: boolean } | null;

export default function Contact() {
  const { ref } = useSectionInView("Contact");
  // Controlled so a failed submit keeps what the user typed (React 19 resets
  // uncontrolled form actions), and we clear them only on success.
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [state, formAction] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const { error } = await sendEmail(formData);
      if (error) {
        toast.error(error);
        return { error };
      }
      toast.success("Email sent successfully!");
      track("contact_submit");
      setEmail("");
      setMessage("");
      return { success: true };
    },
    null,
  );

  // Turnstile tokens are single-use, and this section stays mounted after a
  // submit (unlike a page navigation, which would render a fresh widget), so
  // the widget has to be reset explicitly or a second message can never be
  // sent. Runs after *every* attempt, success or failure.
  useEffect(() => {
    if (state) window.turnstile?.reset();
  }, [state]);

  // Turnstile is third-party and the most expensive thing this page loads, so
  // it is fetched only once the form is near the viewport rather than on page
  // load. `focusin` is a belt-and-braces fallback for anyone who reaches a
  // field without the observer having fired (deep link, tab navigation).
  const formRef = useRef<HTMLFormElement>(null);
  const [turnstileWanted, setTurnstileWanted] = useState(false);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || turnstileWanted) return;
    const form = formRef.current;
    if (!form) return;

    const want = () => setTurnstileWanted(true);
    // Belt and braces for a deep link or tab navigation that reaches a field
    // before the observer has fired.
    form.addEventListener("focusin", want, { once: true });

    if (typeof IntersectionObserver === "undefined") {
      // No observer to be lazy with: load on the next tick rather than never.
      // Deferred rather than called inline so this stays a state update from a
      // callback, not one made directly during the effect.
      const timer = setTimeout(want, 0);
      return () => {
        clearTimeout(timer);
        form.removeEventListener("focusin", want);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          want();
        }
      },
      { rootMargin: "800px" },
    );
    observer.observe(form);
    return () => {
      observer.disconnect();
      form.removeEventListener("focusin", want);
    };
  }, [turnstileWanted]);

  useEffect(() => {
    if (!turnstileWanted) return;
    const src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    if (document.querySelector(`script[src="${src}"]`)) return;
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [turnstileWanted]);

  return (
    <m.section
      id="contact"
      ref={ref}
      tabIndex={-1}
      aria-label="Contact"
      className="mb-20 sm:mb-28 w-[min(100%,38rem)] text-center outline-none scroll-mt-28"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1 }}
      viewport={{ once: true }}
    >
      <SectionHeading>Contact me</SectionHeading>

      <p className="text-gray-700 -mt-6 dark:text-white/80">
        Have a role, a project, or just want to say hi? Drop me a line below, or
        email me directly at{" "}
        <a className="underline" href={`mailto:${emailId}`}>
          {emailId}
        </a>
        .
      </p>

      <form
        ref={formRef}
        className="mt-10 flex flex-col dark:text-black"
        action={formAction}
      >
        {/* Honeypot: hidden from real users; spam bots fill it and get
            silently dropped server-side. A non-semantic name + ignore hints
            keep browsers/password managers from autofilling it (which would
            wrongly drop a legitimate message). */}
        <input
          type="text"
          name="contact_reason_hp"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          data-1p-ignore="true"
          data-lpignore="true"
          className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
        />
        <label htmlFor="senderEmail" className="sr-only">
          Your email
        </label>
        <input
          id="senderEmail"
          name="senderEmail"
          type="email"
          required
          maxLength={EMAIL_MAX_LENGTH}
          autoComplete="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={state?.error ? true : undefined}
          aria-describedby={state?.error ? "contact-error" : undefined}
          className="h-14 px-4 rounded-lg borderBlack outline-none transition-all focus-ring dark:bg-white/80 dark:focus:bg-white"
        />
        <label htmlFor="message" className="sr-only">
          Your message
        </label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={MESSAGE_MAX_LENGTH}
          placeholder="Your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            // Cmd/Ctrl+Enter submits; plain Enter stays a newline. Click the
            // submit button (a real submitter) rather than form.requestSubmit(),
            // which does not reliably trigger a React 19 form action in WebKit.
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.form
                ?.querySelector<HTMLButtonElement>('button[type="submit"]')
                ?.click();
            }
          }}
          aria-invalid={state?.error ? true : undefined}
          aria-describedby={state?.error ? "contact-error" : undefined}
          className="h-52 my-3 resize-y rounded-lg borderBlack p-4 outline-none transition-all focus-ring dark:bg-white/80 dark:focus:bg-white"
        />
        {TURNSTILE_SITE_KEY && (
          <div
            className="cf-turnstile self-center"
            data-sitekey={TURNSTILE_SITE_KEY}
            data-action={TURNSTILE_ACTION}
            // interaction-only keeps the widget invisible unless Cloudflare
            // decides a challenge is actually needed, so the form looks
            // unchanged for the overwhelming majority of visitors.
            data-appearance="interaction-only"
          />
        )}

        <SubmitBtn />

        {state?.error && (
          <p
            id="contact-error"
            role="alert"
            className="mt-3 text-sm text-red-600 dark:text-red-400"
          >
            {state.error}
          </p>
        )}
      </form>
    </m.section>
  );
}
