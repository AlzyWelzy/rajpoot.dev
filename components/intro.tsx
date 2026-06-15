"use client";

import Image from "next/image";
import Link from "next/link";
import { m } from "motion/react";
import { BsArrowRight, BsLinkedin } from "react-icons/bs";
import { HiDownload } from "react-icons/hi";
import { FaGithubSquare } from "react-icons/fa";

import profileImage from "@/public/profile.jpg";
import { useSectionInView } from "@/lib/hooks";
import { useActiveSectionContext } from "@/context/active-section-context";

export default function Intro() {
  const { ref } = useSectionInView("Home", 0.5);
  const { setActiveSection, setTimeOfLastClick } = useActiveSectionContext();

  return (
    <section
      ref={ref}
      id="home"
      aria-label="Introduction"
      className="mb-28 max-w-[50rem] text-center sm:mb-0 scroll-mt-[100rem]"
    >
      <div className="flex items-center justify-center">
        <div className="relative">
          <m.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "tween", duration: 0.2 }}
          >
            <Image
              src={profileImage}
              alt="Manvendra Rajpoot — Backend Developer"
              priority
              fetchPriority="high"
              placeholder="blur"
              sizes="96px"
              className="h-24 w-24 rounded-full object-cover border-[0.35rem] border-white shadow-xl"
            />
          </m.div>

          <m.span
            className="absolute bottom-0 right-0 text-4xl"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 125,
              delay: 0.1,
              duration: 0.7,
            }}
            aria-hidden="true"
          >
            👋
          </m.span>
        </div>
      </div>

      <h1 className="mb-10 mt-4 px-4 text-2xl font-medium !leading-[1.5] sm:text-4xl">
        <span className="font-bold">Hello, I&apos;m Manvendra.</span> I&apos;m a{" "}
        <span className="font-bold">backend developer</span> specializing in{" "}
        <span className="italic">
          AI automation &amp;{" "}
          <span className="underline" style={{ whiteSpace: "nowrap" }}>
            cloud engineering.
          </span>
        </span>
      </h1>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 px-4 text-lg font-medium">
        <Link
          href="#contact"
          className="group bg-gray-900 text-white px-7 py-3 flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 hover:scale-110 hover:bg-gray-950 active:scale-105 transition"
          onClick={() => {
            setActiveSection("Contact");
            setTimeOfLastClick(Date.now());
          }}
        >
          Contact me here{" "}
          <BsArrowRight
            aria-hidden="true"
            className="opacity-70 group-hover:translate-x-1 transition"
          />
        </Link>

        <a
          aria-label="Download Manvendra Rajpoot's resume (PDF)"
          className="group bg-white px-7 py-3 flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 hover:scale-110 active:scale-105 transition cursor-pointer borderBlack dark:bg-white/10"
          href="/resume"
          target="_blank"
          rel="noopener"
          download
        >
          Download CV{" "}
          <HiDownload
            aria-hidden="true"
            className="opacity-60 group-hover:translate-y-1 transition"
          />
        </a>

        <a
          aria-label="LinkedIn profile"
          className="bg-white p-4 text-gray-700 hover:text-gray-950 flex items-center gap-2 rounded-full focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 hover:scale-[1.15] active:scale-105 transition cursor-pointer borderBlack dark:bg-white/10 dark:text-white/60"
          href="/linkedin"
          target="_blank"
          rel="noopener"
        >
          <BsLinkedin aria-hidden="true" />
        </a>

        <a
          aria-label="GitHub profile"
          className="bg-white p-4 text-gray-700 flex items-center gap-2 text-[1.35rem] rounded-full focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 hover:scale-[1.15] hover:text-gray-950 active:scale-105 transition cursor-pointer borderBlack dark:bg-white/10 dark:text-white/60"
          href="/github"
          target="_blank"
          rel="noopener"
        >
          <FaGithubSquare aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
