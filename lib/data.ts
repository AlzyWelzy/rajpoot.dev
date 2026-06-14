import React from "react";
import type { StaticImageData } from "next/image";
import { LuGraduationCap, LuCode } from "react-icons/lu";
import articify from "@/public/articify.png";
import rosterly from "@/public/rosterly.png";

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

export type ProjectType = {
  title: string;
  description: string;
  tags: readonly string[];
  imageUrl?: StaticImageData;
  /** Path to a centered logo (public/) for projects without a screenshot. */
  logo?: string;
  liveUrl?: string;
  githubUrl?: string;
};

export const projectsData: ProjectType[] = [
  {
    title: "Multi-Tenant SaaS Platform (CloudTechTiq)",
    description:
      "Built from scratch: the backend for a multi-tenant SaaS portal — secure MFA authentication and access control, AI-powered support features, real-time notifications, and automated background jobs, all shipped through CI/CD pipelines.",
    tags: ["Python", "Django", "DRF", "PostgreSQL", "Docker", "CI/CD"],
    logo: "/cloudtechtiq-logo.svg",
    liveUrl: "https://cloudtechtiq.com/",
    // githubUrl: "https://github.com/Cloudtechtiq-raj/portal-backend",
  },
  {
    title: "Rosterly (Radixlink)",
    description:
      "Contributed to the core development of Rosterly.io — building and refining backend features, authentication, and integrations to improve the overall product and user experience.",
    tags: ["Django", "Python", "PostgreSQL", "React", "Stripe"],
    liveUrl: "https://rosterly.io/",
    imageUrl: rosterly,
  },
  {
    title: "Namecheap Python SDK",
    description:
      "An open-source Python SDK that wraps the Namecheap API behind a clean, typed interface for managing domains and DNS programmatically. Published to PyPI as namecheap-sdk.",
    tags: ["Python", "SDK", "REST API", "PyPI", "Open Source"],
    logo: "/namecheap-sdk-logo.svg",
    liveUrl: "https://pypi.org/project/namecheap-sdk/",
    githubUrl: "https://github.com/AlzyWelzy/namecheap-wrapper",
  },
  {
    title: "Articify",
    description:
      "An open-source, AI-powered web app that automatically summarizes articles — streamlining the reading experience with a fast, modern frontend.",
    tags: ["React", "Redux", "Vite", "Tailwind", "TypeScript"],
    liveUrl: "https://articify.rajpoot.dev/",
    imageUrl: articify,
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

export const emailId = "manvendra@rajpoot.dev" as const;
export const websiteUrl = "rajpoot.dev" as const;

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
