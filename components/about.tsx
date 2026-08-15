import Link from "next/link";

import SectionHeading from "./section-heading";
import SectionSpy from "./section-spy";

// Server component: the prose is static, so only SectionSpy (the scroll-spy
// ref + reveal) crosses into the client bundle.
export default function About() {
  return (
    <SectionSpy
      section="About"
      id="about"
      aria-label="About Manvendra Rajpoot"
      reveal
      className="mb-28 max-w-180 text-center leading-8 outline-none sm:mb-40 scroll-mt-28"
    >
      <SectionHeading>About me</SectionHeading>

      <p className="mb-3">
        I&apos;m a <span className="font-medium">backend developer</span> who
        enjoys building systems that are{" "}
        <span className="font-medium">
          scalable, secure, and quietly reliable
        </span>
        . Across my roles at <span className="font-medium">CloudTechTiq</span>{" "}
        and <span className="font-medium">Radixlink</span>, I&apos;ve designed
        and shipped multi-tenant SaaS platforms, central authentication systems
        with multi-factor auth and role-based access, payment integrations
        across <span className="font-medium">Stripe, Razorpay and PayPal</span>,
        and <span className="font-medium">AI-powered features</span> — from
        automated invoice extraction to grammar correction in customer support.
        My core stack is{" "}
        <span className="font-medium">Python, Django, DRF and FastAPI</span>,
        backed by{" "}
        <span className="font-medium">PostgreSQL, Redis and MongoDB</span>, and
        shipped with{" "}
        <span className="font-medium">Docker, Kubernetes and CI/CD</span>.{" "}
        <span className="italic">My favorite part of the job</span> is the
        problem-solving — turning a messy, manual process into a clean,
        automated system that just works.
      </p>

      <p>
        I care most about the things users never notice:{" "}
        <span className="font-medium">API security</span>, real-time
        notifications, background-job systems, and disaster-recovery plans that
        keep data safe and services running. On the frontend I work with{" "}
        <span className="font-medium">React, Next.js and TypeScript</span>, so I
        can take a feature from the database all the way to the browser.
        I&apos;m currently pursuing my{" "}
        <span className="font-medium">Master of Computer Applications</span> at
        Jain University after completing my BCA at Bundelkhand University, and I
        never stop <span className="underline">learning</span> — a new
        framework, a cloud service, or a better way to architect a backend.
        I&apos;m open to{" "}
        <Link
          href="#contact"
          // Same-page hash link — nothing to prefetch (see header.tsx).
          prefetch={false}
          className="font-medium underline underline-offset-2 hover:text-gray-950 dark:hover:text-white"
        >
          backend and full-stack roles
        </Link>{" "}
        where I can build things that scale.
      </p>
    </SectionSpy>
  );
}
