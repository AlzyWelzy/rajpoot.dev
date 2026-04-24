import React from "react";
import Link from "next/link";

import { siteConfig } from "@/lib/seo";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer
      role="contentinfo"
      className="px-4 pb-10 text-center text-gray-500 dark:text-white/60"
    >
      <p className="mb-2 block text-xs">
        <span className="font-semibold">
          Explore my work in web development.
        </span>{" "}
        Each project reflects my skills and passion. Thanks for visiting!
      </p>

      <nav aria-label="Social" className="mb-3 flex justify-center gap-4 text-xs">
        <Link href="/github" className="underline-offset-4 hover:underline">
          GitHub
        </Link>
        <Link href="/linkedin" className="underline-offset-4 hover:underline">
          LinkedIn
        </Link>
        <Link href="/twitter" className="underline-offset-4 hover:underline">
          Twitter
        </Link>
        <a
          href={`mailto:${siteConfig.email}`}
          className="underline-offset-4 hover:underline"
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
