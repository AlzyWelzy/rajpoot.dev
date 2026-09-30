"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { m } from "motion/react";
import { track } from "@vercel/analytics";
import toast from "react-hot-toast";

import SectionHeading from "./section-heading";
import SubmitBtn from "./submit-btn";
import { useSectionInView } from "@/lib/hooks";
import { isAgentSubmit } from "@/lib/webmcp";
import type { SendEmailResult } from "@/lib/types";
import { sendEmail } from "@/actions/sendEmail";
import {
  contactTool,
  emailId,
  NAME_MAX_LENGTH,
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

/** What the WebMCP tool reports back to the agent. */
type ContactToolResult = { sent: true } | { sent: false; error: string };

/**
 * Pending agent invocations, keyed by the exact FormData the action receives,
 * so each result settles the invocation that produced it and nothing else.
 */
const agentInvocations = new WeakMap<
  FormData,
  PromiseWithResolvers<ContactToolResult>
>();

export default function Contact() {
  const { ref } = useSectionInView("Contact");
  // Controlled so a failed submit keeps what the user typed (React 19 resets
  // uncontrolled form actions), and we clear them only on success.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [state, formAction] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const agent = agentInvocations.get(formData);
      agentInvocations.delete(formData);

      let result: SendEmailResult;
      try {
        result = await sendEmail(formData);
      } catch (err) {
        // Settle the agent's call before this reaches the error boundary, or
        // the tool invocation would hang with no result.
        agent?.reject(err);
        throw err;
      }

      const { error } = result;
      if (error) {
        toast.error(error);
        agent?.resolve({ sent: false, error });
        return { error };
      }
      toast.success("Email sent successfully!");
      track("contact_submit");
      agent?.resolve({ sent: true });
      setName("");
      setEmail("");
      setMessage("");
      return { success: true };
    },
    null,
  );

  // An agent submission (WebMCP) has to be answered with the tool's result
  // via event.respondWith(), and the browser only accepts that once default
  // has been prevented, during dispatch. React's own form-action handling
  // can't cover it: it runs *after* onSubmit and skips the action entirely if
  // the event is already prevented. Without this, React would prevent the
  // event itself and never respond, and the browser would report the call to
  // the agent as failed although the message was sent — inviting a retry and
  // a duplicate email. So for agents, this handler takes over the submission
  // and schedules the action itself. React still shows the pending form
  // status, because a transition was started during the prevented submit.
  // Human submissions return early and take React's normal path untouched.
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    const event = e.nativeEvent;
    if (!isAgentSubmit(event)) return;

    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const invocation = Promise.withResolvers<ContactToolResult>();
    agentInvocations.set(formData, invocation);
    event.respondWith(invocation.promise);
    startTransition(() => formAction(formData));
  };

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
        onSubmit={handleSubmit}
        // WebMCP: registers this form as an agent-callable tool. There is
        // deliberately no `toolautosubmit` — this sends a message to a real
        // person, so the browser pauses after the agent fills the fields and
        // the visitor presses Send (which also keeps Turnstile's check a human
        // one). Each field sets toolparamdescription explicitly: Chrome would
        // fall back to the sr-only label ("Your name"), but that tells an
        // agent nothing about limits or intent.
        //
        // Server-rendered on purpose, not added after hydration. Chrome logs
        // a schema issue for every intermediate state when the attributes
        // arrive one at a time on a live form — which is exactly what a
        // client-side render does — and Lighthouse fails the page on it. The
        // parser applies them together. A call an agent makes before
        // hydration is cancelled by Chrome ("tool definition was updated")
        // rather than half-completed, so the agent is told to retry.
        toolname={contactTool.name}
        tooltitle={contactTool.title}
        tooldescription={contactTool.description}
      >
        {/* Honeypot: hidden from real users; spam bots fill it and get
            silently dropped server-side. A non-semantic name + ignore hints
            keep browsers/password managers from autofilling it (which would
            wrongly drop a legitimate message).

            readOnly keeps it out of the WebMCP tool schema — Chrome skips
            disabled and read-only controls when building it. Without that, an
            agent would be offered an undescribed "contact_reason_hp" string,
            could fill it in good faith, and have the message silently
            dropped. Unlike `disabled`, a read-only field is still submitted,
            and scripts that set .value directly still trip it. */}
        <input
          type="text"
          name="contact_reason_hp"
          readOnly
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          data-1p-ignore="true"
          data-lpignore="true"
          className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="senderName" className="sr-only">
              Your name
            </label>
            <input
              id="senderName"
              name="senderName"
              toolparamdescription={contactTool.params.senderName}
              type="text"
              required
              maxLength={NAME_MAX_LENGTH}
              autoComplete="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={state?.error ? true : undefined}
              aria-describedby={state?.error ? "contact-error" : undefined}
              className="h-14 w-full px-4 rounded-lg borderBlack outline-none transition-all focus-ring dark:bg-white/80 dark:focus:bg-white"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="senderEmail" className="sr-only">
              Your email
            </label>
            <input
              id="senderEmail"
              name="senderEmail"
              toolparamdescription={contactTool.params.senderEmail}
              type="email"
              required
              maxLength={EMAIL_MAX_LENGTH}
              autoComplete="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={state?.error ? true : undefined}
              aria-describedby={state?.error ? "contact-error" : undefined}
              className="h-14 w-full px-4 rounded-lg borderBlack outline-none transition-all focus-ring dark:bg-white/80 dark:focus:bg-white"
            />
          </div>
        </div>
        <label htmlFor="message" className="sr-only">
          Your message
        </label>
        <textarea
          id="message"
          name="message"
          toolparamdescription={contactTool.params.message}
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
