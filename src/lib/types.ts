import type { Component } from "svelte";
import type { links } from "./data";

export type SectionName = (typeof links)[number]["name"];

/**
 * Result of the contact endpoint.
 *
 * Both members name both keys on purpose so `{ error }` can be destructured
 * off the union regardless of which branch a caller is holding, without the
 * narrowing being sensitive to how the producing code happens to be written.
 *
 * `data` is deliberately opaque — its shape differs between a real Resend
 * response and the honeypot/E2E short-circuits, and no caller reads it.
 */
export type SendEmailResult =
  { error: string; data?: undefined } | { data: unknown; error?: undefined };

export type IconComponent = Component<{
  class?: string;
  size?: string | number;
}>;

export type ProjectType = {
  title: string;
  description: string;
  tags: readonly string[];
  /** Path to a centered logo (static/) shown on the project card. */
  logo?: string;
  liveUrl?: string;
  /** Label for the live link (defaults to "Live"); use "Company site" etc.
   *  when the URL is a marketing page rather than the app itself. */
  liveLabel?: string;
  githubUrl?: string;
};

export type ExperienceType = {
  title: string;
  location: string;
  description: string;
  icon: IconComponent;
  date: string;
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
