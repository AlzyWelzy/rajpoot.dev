import { links } from "./data";

export type SectionName = (typeof links)[number]["name"];

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
