"use client";

import { useActionState, useState } from "react";
import { m } from "motion/react";
import toast from "react-hot-toast";

import SectionHeading from "./section-heading";
import SubmitBtn from "./submit-btn";
import { useSectionInView } from "@/lib/hooks";
import { sendEmail } from "@/actions/sendEmail";
import { emailId } from "@/lib/data";

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
      setEmail("");
      setMessage("");
      return { success: true };
    },
    null,
  );

  return (
    <m.section
      id="contact"
      ref={ref}
      aria-label="Contact"
      className="mb-20 sm:mb-28 w-[min(100%,38rem)] text-center scroll-mt-28"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1 }}
      viewport={{ once: true }}
    >
      <SectionHeading>Contact me</SectionHeading>

      <p className="text-gray-700 -mt-6 dark:text-white/80">
        Please contact me directly at{" "}
        <a className="underline" href={`mailto:${emailId}`}>
          {emailId}
        </a>{" "}
        or through this form.
      </p>

      <form className="mt-10 flex flex-col dark:text-black" action={formAction}>
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
          maxLength={500}
          autoComplete="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-14 px-4 rounded-lg borderBlack dark:bg-white/80 dark:focus:bg-white transition-all dark:outline-none"
        />
        <label htmlFor="message" className="sr-only">
          Your message
        </label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={5000}
          placeholder="Your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="h-52 my-3 rounded-lg borderBlack p-4 dark:bg-white/80 dark:focus:bg-white transition-all dark:outline-none"
        />
        <SubmitBtn />

        {state?.error && (
          <p
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
