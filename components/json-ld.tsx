import { siteConfig } from "@/lib/seo";
import { skillsData } from "@/lib/data";

const personId = `${siteConfig.url}/#person`;
const websiteId = `${siteConfig.url}/#website`;

export default function JsonLd() {
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
        knowsAbout: skillsData as unknown as string[],
        knowsLanguage: ["English", "Hindi"],
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
          "https://twitter.com/AlzyWelzy",
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
        "@id": `${siteConfig.url}/#profilepage`,
        url: siteConfig.url,
        name: `${siteConfig.name} — ${siteConfig.jobTitle}`,
        description: siteConfig.description,
        inLanguage: siteConfig.language,
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": personId },
        about: { "@id": personId },
      },
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
