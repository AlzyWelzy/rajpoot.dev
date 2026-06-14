"use client";

import { useRef } from "react";
import Image from "next/image";
import { m, useScroll, useTransform } from "motion/react";
import { LuGithub, LuExternalLink, LuCode } from "react-icons/lu";

import type { ProjectType } from "@/lib/data";

export default function Project({
  title,
  description,
  tags,
  imageUrl,
  logo,
  liveUrl,
  githubUrl,
}: ProjectType) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["0 1", "1.33 1"],
  });
  const scaleProgress = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const opacityProgress = useTransform(scrollYProgress, [0, 1], [0.6, 1]);

  return (
    <m.article
      ref={ref}
      style={{ scale: scaleProgress, opacity: opacityProgress }}
      className="group mb-6 overflow-hidden rounded-2xl border border-black/5 bg-gray-100 shadow-sm transition last:mb-0 hover:shadow-md dark:border-white/10 dark:bg-white/4"
    >
      <div className="relative aspect-video w-full overflow-hidden border-b border-black/5 bg-linear-to-br from-[#241659] to-[#0b1020] dark:border-white/10">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`Screenshot of the ${title} project`}
            fill
            quality={90}
            placeholder="blur"
            loading="lazy"
            sizes="(min-width: 700px) 42rem, 100vw"
            className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
          />
        ) : logo ? (
          <div className="flex h-full w-full items-center justify-center">
            {/* SVG logo — next/image doesn't optimize SVGs, so a plain img is correct here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt={`${title} logo`}
              width={120}
              height={120}
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
          aria-label="Technologies used"
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
                aria-label={`Open ${title} (opens in a new tab)`}
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white outline-none transition hover:bg-gray-950 focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 dark:bg-white/15 dark:hover:bg-white/25"
              >
                <LuExternalLink aria-hidden="true" /> Live
              </a>
            )}
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${title} source code on GitHub (opens in a new tab)`}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-gray-800 outline-none transition hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/10"
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
