import About from "@/components/about";
import Contact from "@/components/contact";
import Experience from "@/components/experience";
import Intro from "@/components/intro";
import Projects from "@/components/projects";
import SectionDivider from "@/components/section-divider";
import Skills from "@/components/skills";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: `${siteConfig.name} — Backend Developer (AI & Cloud) | Portfolio`,
  },
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="flex flex-col items-center px-4 outline-none"
    >
      <Intro />
      <SectionDivider />
      <About />
      <Projects />
      <Skills />
      <Experience />
      <Contact />
    </main>
  );
}
