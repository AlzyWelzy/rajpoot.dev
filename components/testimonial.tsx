"use client";

import { m } from "motion/react";
import { LuQuote } from "react-icons/lu";

import type { TestimonialType } from "@/lib/types";

export default function Testimonial({
  quote,
  author,
  title,
  source,
  sourceUrl,
  index = 0,
}: TestimonialType & { index?: number }) {
  return (
    <m.li
      // One-shot reveal on enter, staggered per card (cheap; runs once).
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="flex w-full flex-col rounded-2xl border border-black/5 bg-gray-100 p-6 text-left shadow-sm sm:max-w-md sm:p-7 dark:border-white/10 dark:bg-white/4"
    >
      <LuQuote
        aria-hidden="true"
        className="mb-3 h-7 w-7 text-gray-400 dark:text-white/30"
      />
      <blockquote className="leading-relaxed text-gray-700 dark:text-white/80">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <footer className="mt-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{author}</p>
          <p className="text-sm text-gray-600 dark:text-white/60">{title}</p>
        </div>
        {source &&
          (sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${source} (opens in a new tab)`}
              className="shrink-0 rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-gray-600 outline-none transition hover:bg-black/5 focus-ring dark:border-white/15 dark:text-white/60 dark:hover:bg-white/10"
            >
              {source}
            </a>
          ) : (
            <span className="shrink-0 rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-gray-500 dark:border-white/15 dark:text-white/50">
              {source}
            </span>
          ))}
      </footer>
    </m.li>
  );
}
