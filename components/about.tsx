"use client";

import React from "react";
import { m } from "motion/react";

import SectionHeading from "./section-heading";
import { useSectionInView } from "@/lib/hooks";

export default function About() {
  const { ref } = useSectionInView("About");

  return (
    <m.section
      ref={ref}
      id="about"
      aria-label="About Manvendra Rajpoot"
      className="mb-28 max-w-[45rem] text-center leading-8 sm:mb-40 scroll-mt-28"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.175 }}
    >
      <SectionHeading>About me</SectionHeading>

      <p className="mb-3">
        I&apos;m a <span className="font-medium">backend developer</span> who
        enjoys building systems that are{" "}
        <span className="font-medium">scalable, secure, and quietly reliable</span>.
        Over the past two years at{" "}
        <span className="font-medium">CloudTechTiq</span> and{" "}
        <span className="font-medium">Radixlink</span>, I&apos;ve designed and
        shipped multi-tenant SaaS platforms, central authentication systems with
        multi-factor auth and role-based access, payment integrations across{" "}
        <span className="font-medium">Stripe, Razorpay and PayPal</span>, and{" "}
        <span className="font-medium">AI-powered features</span> — from automated
        invoice extraction to grammar correction in customer support. My core
        stack is{" "}
        <span className="font-medium">
          Python, Django, DRF and FastAPI
        </span>
        , backed by <span className="font-medium">PostgreSQL, Redis and MongoDB</span>
        , and shipped with{" "}
        <span className="font-medium">Docker, Kubernetes and CI/CD</span>.{" "}
        <span className="italic">My favorite part of the job</span> is the
        problem-solving — turning a messy, manual process into a clean, automated
        system that just works.
      </p>

      <p>
        I care most about the things users never notice:{" "}
        <span className="font-medium">API security</span>, real-time
        notifications, background-job systems, and disaster-recovery plans that
        keep data safe and services running. On the frontend I work with{" "}
        <span className="font-medium">React, Next.js and TypeScript</span>, so I
        can take a feature from the database all the way to the browser. I&apos;m
        currently pursuing my{" "}
        <span className="font-medium">Master of Computer Applications</span> at
        Jain University after completing my BCA at Bundelkhand University, and I
        never stop <span className="underline">learning</span> — a new framework,
        a cloud service, or a better way to architect a backend. I&apos;m open to{" "}
        <span className="font-medium">backend and full-stack roles</span> where I
        can build things that scale.
      </p>
    </m.section>
  );
}
