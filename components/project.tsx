"use client";

import { m } from "motion/react";
import { LuGithub, LuExternalLink, LuCode } from "react-icons/lu";

import type { ProjectType } from "@/lib/types";

export default function Project({
  title,
  description,
  tags,
  logo,
  liveUrl,
  liveLabel = "Live",
  githubUrl,
}: ProjectType) {
  return (
    <m.article
      // One-shot reveal on enter (cheap, runs once) instead of a per-card
      // scroll tracker — no continuous scroll listeners / layout reads.
      // whileHover lifts the card via motion (not a CSS class) so it doesn't
      // fight the inline transform motion already manages.
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4 }}
      className="group mb-6 overflow-hidden rounded-2xl border border-black/5 bg-gray-100 shadow-sm transition last:mb-0 hover:shadow-md dark:border-white/10 dark:bg-white/4"
    >
      <div className="relative aspect-video w-full overflow-hidden border-b border-black/5 bg-linear-to-br from-[#241659] to-[#0b1020] dark:border-white/10">
        {logo ? (
          <div className="flex h-full w-full items-center justify-center">
            {/* SVG logo — next/image doesn't optimize SVGs, so a plain img is correct here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt={`${title} logo`}
              width={120}
              height={120}
              loading="lazy"
              decoding="async"
              className="h-28 w-28 drop-shadow-xl transition duration-500 group-hover:scale-110"
            />
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center"
          >
            <LuCode
              className="text-white/80 transition duration-500 group-hover:scale-110"
              size={72}
            />
          </div>
        )}
      </div>

      <div className="p-6 sm:p-7">
        <h3 className="text-2xl font-semibold">{title}</h3>
        <p className="mt-2 leading-relaxed text-gray-700 dark:text-white/70">
          {description}
        </p>

        <ul
          className="mt-4 flex flex-wrap gap-2"
          aria-label={`Technologies used in ${title}`}
        >
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-black/70 px-3 py-1 text-[0.7rem] uppercase tracking-wider text-white dark:bg-white/10 dark:text-white/70"
            >
              {tag}
            </li>
          ))}
        </ul>

        {(liveUrl || githubUrl) && (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${title} — ${liveLabel} (opens in a new tab)`}
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white outline-none transition hover:scale-105 hover:bg-gray-950 active:scale-100 focus-ring dark:bg-white/15 dark:hover:bg-white/25"
              >
                <LuExternalLink aria-hidden="true" /> {liveLabel}
              </a>
            )}
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${title} source code on GitHub (opens in a new tab)`}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-gray-800 outline-none transition hover:scale-105 hover:bg-black/5 active:scale-100 focus-ring dark:border-white/20 dark:text-white/80 dark:hover:bg-white/10"
              >
                <LuGithub aria-hidden="true" /> Code
              </a>
            )}
          </div>
        )}
      </div>
    </m.article>
  );
}
