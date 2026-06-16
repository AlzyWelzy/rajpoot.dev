import { siteConfig } from "@/lib/seo";
import { skillsData, projectsData } from "@/lib/data";

const personId = `${siteConfig.url}/#person`;
const websiteId = `${siteConfig.url}/#website`;
const profileId = `${siteConfig.url}/#profilepage`;

const KNOWN_LANGS = ["Python", "TypeScript", "JavaScript"];

export default function JsonLd() {
  // Spread to drop the readonly tuple type without an `as unknown` escape hatch.
  const skills = [...skillsData];

  // Each project as a structured node, authored by the Person, so search
  // engines can associate the portfolio's work with its owner.
  const projectNodes = projectsData.map((p, i) => {
    const id = `${siteConfig.url}/#project-${i + 1}`;
    const isCode = Boolean(p.githubUrl);
    const lang = p.tags.find((t) => KNOWN_LANGS.includes(t));
    return {
      "@type": isCode ? "SoftwareSourceCode" : "CreativeWork",
      "@id": id,
      name: p.title,
      description: p.description,
      author: { "@id": personId },
      keywords: p.tags.join(", "),
      ...(p.liveUrl ? { url: p.liveUrl } : {}),
      ...(p.githubUrl ? { codeRepository: p.githubUrl } : {}),
      ...(isCode && lang ? { programmingLanguage: lang } : {}),
    };
  });

  // Single @graph so every node can reference the canonical Person via @id —
  // this is what lets ProfilePage.mainEntity, WebSite.about, etc. resolve.
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: siteConfig.name,
        alternateName: ["Manvendra", "AlzyWelzy"],
        url: siteConfig.url,
        image: `${siteConfig.url}/profile.jpg`,
        jobTitle: siteConfig.jobTitle,
        description: siteConfig.description,
        email: `mailto:${siteConfig.email}`,
        knowsAbout: skills,
        knowsLanguage: ["English", "Hindi"],
        hasOccupation: {
          "@type": "Occupation",
          name: "Backend Developer",
          occupationalCategory: "15-1252",
          description:
            "Builds scalable, secure backend systems, AI automation, robust APIs, and cloud infrastructure.",
          skills: skills.join(", "),
        },
        worksFor: {
          "@type": "Organization",
          name: "CloudTechTiq",
          url: "https://cloudtechtiq.com/",
        },
        alumniOf: [
          { "@type": "CollegeOrUniversity", name: "Jain University" },
          { "@type": "CollegeOrUniversity", name: "Bundelkhand University" },
        ],
        address: {
          "@type": "PostalAddress",
          addressLocality: siteConfig.location.city,
          addressRegion: siteConfig.location.region,
          addressCountry: siteConfig.location.countryCode,
        },
        nationality: { "@type": "Country", name: siteConfig.location.country },
        sameAs: [
          siteConfig.github,
          siteConfig.linkedin,
          siteConfig.twitterUrl,
          siteConfig.blog,
        ],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: `${siteConfig.name} — Portfolio`,
        url: siteConfig.url,
        inLanguage: siteConfig.language,
        publisher: { "@id": personId },
        about: { "@id": personId },
      },
      {
        "@type": "ProfilePage",
        "@id": profileId,
        url: siteConfig.url,
        name: `${siteConfig.name} — ${siteConfig.jobTitle}`,
        description: siteConfig.description,
        // Content-derived (not render-time) so it conveys real freshness.
        dateModified: siteConfig.lastUpdated,
        inLanguage: siteConfig.language,
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": personId },
        about: { "@id": personId },
        hasPart: projectNodes.map((p) => ({ "@id": p["@id"] })),
      },
      ...projectNodes,
    ],
  };

  // Escape "<" so a value can never close the <script> tag early (XSS hardening).
  const json = JSON.stringify(graph).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
