import { links } from "./data";

export type SectionName = (typeof links)[number]["name"];

export type IconName = "code" | "graduation-cap";

export type ProjectType = {
  title: string;
  description: string;
  tags: readonly string[];
  /** Path to a centered logo (public/) shown on the project card. */
  logo?: string;
  liveUrl?: string;
  /** Label for the live link (defaults to "Live"); use "Company site" etc.
   *  when the URL is a marketing page rather than the app itself. */
  liveLabel?: string;
  githubUrl?: string;
};

export type TestimonialType = {
  /** The endorsement, quoted verbatim from a real, verifiable source. */
  quote: string;
  author: string;
  /** Author's role/company, e.g. "Human Resources · Radixlink". */
  title: string;
  /** Provenance label shown as a small tag, e.g. "Relieving letter",
   *  "LinkedIn". Omit to show none. */
  source?: string;
  /** Optional link to verify the quote (e.g. a LinkedIn recommendation URL). */
  sourceUrl?: string;
};
