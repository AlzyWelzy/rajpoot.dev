import {
  BsEnvelope,
  BsFacebook,
  BsGithub,
  BsInstagram,
  BsLinkedin,
  BsRssFill,
  BsTwitterX,
} from "react-icons/bs";

import { siteConfig } from "@/lib/seo";

// Social entries point at the internal redirect routes (next.config.mjs), so
// the destination URLs stay defined in one place.
const socialLinks = [
  { label: "GitHub", href: "/github", Icon: BsGithub },
  { label: "LinkedIn", href: "/linkedin", Icon: BsLinkedin },
  { label: "X (Twitter)", href: "/twitter", Icon: BsTwitterX },
  { label: "Instagram", href: "/instagram", Icon: BsInstagram },
  { label: "Facebook", href: "/facebook", Icon: BsFacebook },
  { label: "Blog", href: siteConfig.blog, Icon: BsRssFill },
] as const;

const iconLinkClasses =
  "flex min-h-11 min-w-11 items-center justify-center rounded-full focus-ring transition hover:scale-115 hover:text-gray-950 active:scale-105 dark:hover:text-white";

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

      <nav
        aria-label="Social links"
        className="mb-3 flex flex-wrap items-center justify-center gap-1 text-lg"
      >
        {socialLinks.map(({ label, href, Icon }) => (
          <a
            key={label}
            aria-label={label}
            title={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={iconLinkClasses}
          >
            <Icon aria-hidden="true" />
          </a>
        ))}
        <a
          aria-label="Email"
          title="Email"
          href={`mailto:${siteConfig.email}`}
          className={iconLinkClasses}
        >
          <BsEnvelope aria-hidden="true" />
        </a>
      </nav>

      <small className="text-xs">
        &copy; {currentYear} {siteConfig.name}. All rights reserved.
      </small>
    </footer>
  );
}
