import React from "react";
import { LuGraduationCap, LuCode } from "react-icons/lu";
import articify from "@/public/articify.png";
import cloudtechtiq from "@/public/cloudtechtiq.png";
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
    title: "Full Stack Developer (CloudTechtiq)",
    location: "Jaipur, Rajasthan",
    description:
      "As a Full Stack Developer at CloudTechtiq, I specialize in building and optimizing scalable backend systems, ensuring seamless authentication, payment processing, and deployment automation. I have designed and implemented multi-tenant architectures with MFA authentication, dynamic configuration management, and automated invoicing to enhance security and flexibility. My role also involves integrating payment gateways such as Razorpay, PayPal, and Stripe, managing multi-webhook processing, and streamlining CI/CD pipelines for efficient deployments. Additionally, I optimize cloud infrastructure to improve performance, scalability, and cost efficiency while maintaining high system reliability.",
    icon: React.createElement(LuCode),
    date: "October, 2024 - present",
  },
  {
    title: "Full Stack Developer (Radixlink)",
    location: "Chandler, Arizona",
    description:
      "As a Full Stack Developer at Radixlink, I design and build scalable web applications, working closely with cross-functional teams to deliver high-quality software solutions. My role involves developing both front-end and back-end components, ensuring smooth integration and optimal performance. I also participate in code reviews, contribute to technical documentation, and mentor junior developers. This position allows me to utilize my expertise in various technologies, enhance my problem-solving skills, and stay updated with industry trends to continuously improve our development processes.",
    icon: React.createElement(LuCode),
    date: "June, 2023 - September, 2024",
  },
  {
    title: "BCA (Bachelor of Computer Applications)",
    location: "Jhansi, Uttar Pradesh",
    description:
      "I pursued my BCA degree at Chandra Sekhar Azad Institute of Science and Technology from 2021 to 2024, deepening my skills and knowledge in the field of computer applications.",
    icon: React.createElement(LuGraduationCap),
    date: "2021 - 2024",
  },
  {
    title: "Higher Secondary (Class 11 - Class 12)",
    location: "Jhansi, Uttar Pradesh",
    description:
      "I continued my education at Government Inter College for Class 11 and Class 12, where I further honed my passion for computer science and programming.",
    icon: React.createElement(LuGraduationCap),
    date: "2020",
  },
  {
    title: "High School (Class 9 - Class 10)",
    location: "Jhansi, Uttar Pradesh",
    description:
      "I was a student at Modern Public School from Class 9 to Class 12, and it was during this time that I discovered my deep interest in computers and programming.",
    icon: React.createElement(LuGraduationCap),
    date: "2018",
  },
] as const;

export const projectsData = [
  {
    title: "Internal Team Product (CloudTechtiq)",
    description:
      "Designed and developed a new internal product at CloudTechtiq, streamlining team workflows and improving operational efficiency.",
    tags: ["Django", "Python", "React", "PostgreSQL", "CI/CD"],
    project_link: "https://cloudtechtiq.com/",
    imageUrl: cloudtechtiq,
  },
  {
    title: "Rosterly (Radixlink)",
    description:
      "Contributed to the core development of Rosterly.io at Radixlink, enhancing existing features and implementing new functionalities to improve the overall product.",
    tags: ["Django", "Python", "JavaScript", "React", "PostgreSQL"],
    project_link: "https://rosterly.io/",
    imageUrl: rosterly,
  },
  {
    title: "Articify",
    description:
      "Developed an open-source AI-powered web app for automated article summarization, streamlining the reading experience.",
    tags: ["React", "Redux", "Vite", "Tailwind", "TypeScript"],
    imageUrl: articify,
    project_link: "https://articify.rajpoot.dev/",
  },
] as const;

export const skillsData = [
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "Python",
  "React",
  "Next.js",
  "Tailwind CSS",
  "Redux",
  "Framer Motion",
  "Node.js",
  "Django",
  "Django Rest Framework",
  "FastAPI",
  "Express",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "GraphQL",
  "Supabase",
  "Vercel",
  "AWS",
  "Git",
  "Vite",
  "ESLint",
  "Prettier",
  "Linux",
  "Jira",
  "JWT",
  "Docker",
  "Kubernetes",
  "GitHub Actions",
  "Docker Compose",
  "CI/CD",
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
