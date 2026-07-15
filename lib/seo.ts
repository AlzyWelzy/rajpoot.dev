export const siteConfig = {
  name: "Manvendra Rajpoot",
  shortName: "Manvendra",
  jobTitle: "Backend Developer",
  // Full résumé headline — used for OG image, hero, and rich phrasing.
  roleline: "Backend Developer · Automation & AI · Cloud Engineering",
  tagline:
    "Backend developer building scalable, secure, AI-powered systems and robust APIs.",
  description:
    "Manvendra Rajpoot is a backend developer specializing in AI automation, robust API design, and cloud engineering. He builds scalable, secure, multi-tenant systems with Python, Django, DRF, FastAPI, PostgreSQL, Redis, Docker, and Kubernetes. Explore projects, experience, and get in touch.",
  url: "https://www.rajpoot.dev",
  ogImage: "/opengraph-image",
  email: "manvendra@rajpoot.dev",
  locale: "en_US",
  language: "en",
  location: {
    city: "Jaipur",
    region: "Rajasthan",
    country: "India",
    countryCode: "IN",
  },
  // OG card uses the spec field name "twitter"; the profile URL is on x.com.
  twitter: "@AlzyWelzy",
  twitterUrl: "https://x.com/AlzyWelzy",
  github: "https://github.com/AlzyWelzy",
  linkedin: "https://linkedin.com/in/AlzyWelzy",
  instagram: "https://www.instagram.com/alzywelzyy/",
  facebook: "https://www.facebook.com/AlzyWelzyy",
  // Blog lives on its own subdomain.
  blog: "https://blog.rajpoot.dev",
  // Bump this on meaningful content changes. Drives sitemap `lastmod` and
  // JSON-LD `dateModified` from a single source rather than build time, so the
  // freshness signal reflects real updates, not redeploys.
  lastUpdated: "2026-06-16",
  // Highlighted stack used in the OG image card.
  ogTags: ["Python", "Django", "FastAPI", "PostgreSQL", "Docker", "Kubernetes"],
  // A concise, distinct set. The keywords meta is not a ranking signal for
  // Google, so permuted name/role variants only add payload.
  keywords: [
    "Manvendra Rajpoot",
    "Backend Developer",
    "Python Developer",
    "Django Developer",
    "FastAPI Developer",
    "API Developer",
    "AI Automation Developer",
    "Cloud Engineer",
    "DevOps Engineer",
    "SaaS Developer",
    "Software Developer India",
    "rajpoot.dev",
  ],
} as const;

export type SiteConfig = typeof siteConfig;
