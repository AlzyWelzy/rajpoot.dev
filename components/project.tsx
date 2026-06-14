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
  liveUrl,
  githubUrl,
}: ProjectType) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["0 1", "1.33 1"],
  });
  const scaleProgress = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const opacityProgress = useTransform(scrollYProgress, [0, 1], [0.6, 1]);

  const mediaClasses =
    "absolute hidden sm:block top-8 -right-40 w-[28.25rem] rounded-t-lg shadow-2xl transition group-hover:scale-[1.04] group-hover:-translate-x-3 group-hover:translate-y-3 group-hover:-rotate-2 group-even:group-hover:translate-x-3 group-even:group-hover:translate-y-3 group-even:group-hover:rotate-2 group-even:right-[initial] group-even:-left-40";

  return (
    <m.article
      ref={ref}
      style={{ scale: scaleProgress, opacity: opacityProgress }}
      className="group mb-3 sm:mb-8 last:mb-0"
    >
      <div className="bg-gray-100 max-w-[42rem] border border-black/5 rounded-lg overflow-hidden sm:pr-8 relative sm:h-[20rem] transition group-hover:bg-gray-200 sm:group-even:pl-8 dark:text-white dark:bg-white/10 dark:group-hover:bg-white/20">
        <div className="pt-4 pb-7 px-5 sm:pl-10 sm:pr-2 sm:pt-10 sm:max-w-[50%] flex flex-col h-full sm:group-even:ml-[18rem]">
          <h3 className="text-2xl font-semibold">{title}</h3>
          <p className="mt-2 leading-relaxed text-gray-700 dark:text-white/70">
            {description}
          </p>

          <div className="mt-4 sm:mt-auto">
            <ul
              className="flex flex-wrap gap-2"
              aria-label="Technologies used"
            >
              {tags.map((tag) => (
                <li
                  className="bg-black/[0.7] px-3 py-1 text-[0.7rem] uppercase tracking-wider text-white rounded-full dark:text-white/70"
                  key={tag}
                >
                  {tag}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2.5">
              {liveUrl && (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${title} (opens in a new tab)`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white outline-none transition hover:bg-gray-950 focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 dark:bg-white/15 dark:hover:bg-white/25"
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/15 px-4 py-1.5 text-sm font-medium text-gray-800 outline-none transition hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/10"
                >
                  <LuGithub aria-hidden="true" /> Code
                </a>
              )}
            </div>
          </div>
        </div>

        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`Screenshot of the ${title} project`}
            quality={90}
            placeholder="blur"
            loading="lazy"
            sizes="(min-width: 640px) 28.25rem, 0px"
            className={mediaClasses}
          />
        ) : (
          <div
            aria-hidden="true"
            className={`${mediaClasses} flex h-[16rem] items-center justify-center bg-gradient-to-br from-[#241659] to-[#0b1020]`}
          >
            <LuCode className="text-white/85" size={72} />
          </div>
        )}
      </div>
    </m.article>
  );
}
