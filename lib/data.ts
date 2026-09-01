import React from "react";
import { LuGraduationCap, LuCode } from "react-icons/lu";

import type { ProjectType, TestimonialType } from "./types";
import { siteConfig } from "./seo";

export const links = [
  { name: "Home", hash: "#home" },
  { name: "About", hash: "#about" },
  { name: "Projects", hash: "#projects" },
  { name: "Skills", hash: "#skills" },
  { name: "Experience", hash: "#experience" },
  { name: "Contact", hash: "#contact" },
] as const;

export const experiencesData = [
  {
    title: "Backend Developer (CloudTechTiq)",
    location: "Jaipur, Rajasthan",
    description:
      "I build and scale a multi-tenant SaaS platform — designing secure multi-factor authentication and access control, AI-powered customer-support features (grammar correction and smart suggestions), and a real-time notification system with email/SMS fallbacks. I built a scalable background-job system for routine emails and reports, hardened API security against unauthorized access, and automated deployments for smoother, faster releases.",
    icon: React.createElement(LuCode),
    date: "October 2024 - present",
  },
  {
    title: "Backend Developer (Radixlink)",
    location: "Chandler, Arizona",
    description:
      "I built an AI-driven invoice-automation tool that extracted and organized invoice data to cut manual work and errors, and developed a Central Authentication System with multi-factor auth, role-based access, and Stripe-powered payments. I set up disaster-recovery plans, tuned database performance for reliability, and automated testing and deployment with a CI/CD pipeline that sped up releases while optimizing cloud resource usage.",
    icon: React.createElement(LuCode),
    date: "June 2023 - September 2024",
  },
  {
    title: "MCA — Master of Computer Applications (Jain University)",
    location: "Online · India",
    description:
      "Pursuing my MCA with a focus on software engineering — deepening my foundations in systems design, algorithms, and scalable architecture while working full-time.",
    icon: React.createElement(LuGraduationCap),
    date: "January 2025 - present",
  },
  {
    title: "BCA — Bachelor of Computer Applications (Bundelkhand University)",
    location: "Jhansi, Uttar Pradesh",
    description:
      "Completed my BCA in software engineering, where I built my foundation in programming, databases, and web development and discovered my passion for backend systems.",
    icon: React.createElement(LuGraduationCap),
    date: "2021 - 2024",
  },
] as const;

export const projectsData: ProjectType[] = [
  {
    title: "Multi-Tenant SaaS Platform (CloudTechTiq)",
    description:
      "Architected the backend for a multi-tenant SaaS portal from the ground up — tenant-isolated data, MFA and role-based access control, AI-assisted support tooling, real-time notifications with email/SMS fallbacks, and background job processing, all delivered through automated CI/CD.",
    tags: ["Python", "Django", "DRF", "PostgreSQL", "Docker", "CI/CD"],
    logo: "cloudtechtiq",
    liveUrl: "https://console.cloudtechtiq.com/",
  },
  {
    title: "Rosterly (Radixlink)",
    description:
      "Core backend contributor on Rosterly.io — designed and hardened authentication, third-party integrations, and API features that improved reliability and the day-to-day scheduling experience.",
    tags: ["Django", "Python", "PostgreSQL", "React", "Stripe"],
    logo: "rosterly",
    liveUrl: "https://rosterly.io/",
  },
  {
    title: "Namecheap Python Wrapper",
    description:
      "Open-source Python SDK wrapping the Namecheap API behind a clean, fully typed interface for programmatic domain and DNS management. Published to PyPI as namecheap-wrapper.",
    tags: ["Python", "SDK", "REST API", "PyPI", "Open Source"],
    logo: "namecheap-sdk",
    liveUrl: "https://pypi.org/project/namecheap-wrapper/",
    githubUrl: "https://github.com/AlzyWelzy/namecheap-wrapper",
  },
];

// Only real, verifiable endorsements — no fabricated quotes. The first is taken
// verbatim from the official Radixlink relieving letter (public/, served at
// /experience_letter). Add LinkedIn recommendations here for stronger social
// proof: paste the exact quote, the recommender's name + role, source
// "LinkedIn", and the recommendation URL as sourceUrl.
export const testimonialsData: TestimonialType[] = [
  {
    quote:
      "During their tenure with us, Manvendra consistently demonstrated professionalism, dedication, and a positive attitude towards their work. They were a valuable member of the team and contributed to the company's objectives.",
    author: "Elamathi",
    title: "Human Resources · Radixlink",
    source: "Relieving letter",
  },
];

export const skillsData = [
  "Python",
  "Django",
  "Django REST Framework",
  "FastAPI",
  "Flask",
  "Node.js",
  "Express",
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Tailwind CSS",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "SQL",
  "GraphQL",
  "REST API Design",
  "JWT",
  "Docker",
  "Kubernetes",
  "NGINX",
  "Linux",
  "Bash",
  "Git",
  "CI/CD",
  "GitHub Actions",
  "AWS",
  "Supabase",
  "Vercel",
  "Unit & Integration Testing",
] as const;

// Re-exported from the site config rather than restated, so the address the
// contact form sends to can't drift from the one JSON-LD and security.txt
// publish. lib/seo.ts is the single source of truth for site identity.
export const emailId = siteConfig.email;

// Contact-form field limits, shared by the client inputs (maxLength) and the
// server action's validation so the two can never drift apart.
// Cloudflare Turnstile. The sitekey is public by design and must be inlined
// at build time, hence NEXT_PUBLIC_. The matching TURNSTILE_SECRET is
// server-only and lives in the deployment's env, never here.
//
// TURNSTILE_ACTION is echoed back by siteverify and checked server-side, so a
// token minted for some other widget on some other page can't be replayed
// against this form.
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const TURNSTILE_ACTION = "contact";

export const NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 500;
export const MESSAGE_MAX_LENGTH = 5000;

export const documentsName = {
  cover_letter: "Manvendra_Rajpoot_Cover_Letter.pdf",
  resume: "Manvendra_Rajpoot_Resume.pdf",
  experience_letter: "Manvendra_Rajpoot_Experience_Letter.pdf",
} as const;

export const {
  cover_letter: coverLetterName,
  resume: resumeName,
  experience_letter: experienceLetterName,
} = documentsName;
