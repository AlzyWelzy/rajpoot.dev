"use client";

import React from "react";
import { useFormStatus } from "react-dom";
import { FaPaperPlane } from "react-icons/fa";

export default function SubmitBtn() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={pending ? "Sending message…" : "Send message"}
      aria-busy={pending}
      className="group flex items-center justify-center gap-2 h-[3rem] w-[8rem] bg-gray-900 text-white rounded-full outline-none transition-all focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 hover:scale-110 hover:bg-gray-950 active:scale-105 dark:bg-white dark:bg-opacity-10 disabled:scale-100 disabled:bg-opacity-65"
    >
      {pending ? (
        <div
          role="status"
          aria-label="Sending"
          className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"
        />
      ) : (
        <>
          Submit{" "}
          <FaPaperPlane
            aria-hidden="true"
            className="text-xs opacity-70 transition-all group-hover:translate-x-1 group-hover:-translate-y-1"
          />
        </>
      )}
    </button>
  );
}
