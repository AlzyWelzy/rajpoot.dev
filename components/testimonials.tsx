"use client";

import { m } from "motion/react";
import { LuQuote } from "react-icons/lu";

import SectionHeading from "./section-heading";
import Testimonial from "./testimonial";
import { testimonialsData } from "@/lib/data";

export default function Testimonials() {
  // Renders nothing until there's at least one real endorsement — no empty
  // heading, no placeholder cards.
  if (testimonialsData.length === 0) return null;

  const [first] = testimonialsData;

  return (
    <section
      id="testimonials"
      aria-label="Testimonials"
      className="mb-28 w-full max-w-4xl scroll-mt-28 sm:mb-40"
    >
      <SectionHeading>What people say</SectionHeading>

      {/* A single endorsement reads as sparse in a card grid, so feature it as
          one prominent centered quote. Two or more switch to the card grid. */}
      {testimonialsData.length === 1 && first ? (
        <m.figure
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl rounded-3xl border border-black/5 bg-gray-100 px-6 py-10 text-center shadow-sm sm:px-12 sm:py-12 dark:border-white/10 dark:bg-white/4"
        >
          <LuQuote
            aria-hidden="true"
            className="mx-auto mb-5 h-9 w-9 text-gray-300 dark:text-white/25"
          />
          <blockquote className="text-lg leading-relaxed text-gray-800 sm:text-xl sm:leading-relaxed dark:text-white/85">
            &ldquo;{first.quote}&rdquo;
          </blockquote>
          <figcaption className="mt-6 flex flex-col items-center gap-1">
            <span className="font-semibold">{first.author}</span>
            <span className="text-sm text-gray-600 dark:text-white/60">
              {first.title}
            </span>
            {first.source &&
              (first.sourceUrl ? (
                <a
                  href={first.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${first.source} (opens in a new tab)`}
                  className="mt-2 rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-gray-600 outline-none transition hover:bg-black/5 focus-ring dark:border-white/15 dark:text-white/60 dark:hover:bg-white/10"
                >
                  {first.source}
                </a>
              ) : (
                <span className="mt-2 rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-gray-500 dark:border-white/15 dark:text-white/50">
                  {first.source}
                </span>
              ))}
          </figcaption>
        </m.figure>
      ) : (
        <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-6">
          {testimonialsData.map((testimonial, i) => (
            <Testimonial
              key={`${testimonial.author}-${i}`}
              index={i}
              {...testimonial}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
