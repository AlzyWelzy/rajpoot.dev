import About from "@/components/about";
import Contact from "@/components/contact";
import Experience from "@/components/experience";
import Intro from "@/components/intro";
import Projects from "@/components/projects";
import SectionDivider from "@/components/section-divider";
import Skills from "@/components/skills";
import Testimonials from "@/components/testimonials";
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
  // Testimonials are gated behind a build-time env flag until there's a
  // stronger set of real endorsements. Hidden by default; set
  // SHOW_TESTIMONIALS=true to render the section. It has its own vertical
  // spacing and no surrounding divider, so hiding it cleanly restores the
  // Experience → Contact flow without any layout gap.
  const showTestimonials = process.env.SHOW_TESTIMONIALS === "true";

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
      {showTestimonials && <Testimonials />}
      <Contact />
    </main>
  );
}
