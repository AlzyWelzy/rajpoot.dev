"use client";

import React from "react";
import { m } from "motion/react";
import toast from "react-hot-toast";

import SectionHeading from "./section-heading";
import SubmitBtn from "./submit-btn";
import { useSectionInView } from "@/lib/hooks";
import { sendEmail } from "@/actions/sendEmail";
import { emailId } from "@/lib/data";

export default function Contact() {
  const { ref } = useSectionInView("Contact");

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

      <form
        className="mt-10 flex flex-col dark:text-black"
        action={async (formData) => {
          const { error } = await sendEmail(formData);
          if (error) {
            toast.error(error);
            return;
          }
          toast.success("Email sent successfully!");
        }}
      >
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
          className="h-52 my-3 rounded-lg borderBlack p-4 dark:bg-white/80 dark:focus:bg-white transition-all dark:outline-none"
        />
        <SubmitBtn />
      </form>
    </m.section>
  );
}
