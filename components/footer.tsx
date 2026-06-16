import React from "react";
import Link from "next/link";

import { siteConfig } from "@/lib/seo";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer
      role="contentinfo"
      className="px-4 pb-10 text-center text-gray-600 dark:text-white/70"
    >
      <p className="mb-2 block text-xs">
        <span className="font-semibold">
          Building scalable, secure backends and AI-powered systems.
        </span>{" "}
        Thanks for stopping by.
      </p>

      <nav aria-label="Links" className="mb-3 flex flex-wrap justify-center gap-4 text-xs">
        <a
          href={siteConfig.blog}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-2 py-2 underline-offset-4 hover:underline"
        >
          Blog
        </a>
        <Link href="/github" className="inline-block px-2 py-2 underline-offset-4 hover:underline">
          GitHub
        </Link>
        <Link href="/linkedin" className="inline-block px-2 py-2 underline-offset-4 hover:underline">
          LinkedIn
        </Link>
        <Link href="/twitter" className="inline-block px-2 py-2 underline-offset-4 hover:underline">
          X
        </Link>
        <a
          href={`mailto:${siteConfig.email}`}
          className="inline-block px-2 py-2 underline-offset-4 hover:underline"
        >
          Email
        </a>
      </nav>

      <small className="text-xs">
        &copy; {currentYear} {siteConfig.name}. All rights reserved.
      </small>
    </footer>
  );
}
