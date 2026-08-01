import { links } from "./data";

export type SectionName = (typeof links)[number]["name"];

/**
 * Result of the contact-form server action.
 *
 * Declared explicitly rather than inferred, because inference here is quietly
 * fragile: TypeScript normalizes a union built from *fresh* object literals in
 * return position so that `{ error }` can be destructured off it, but the
 * moment one of those literals is hoisted into a shared constant the
 * normalization stops applying and every caller breaks. Both members naming
 * both keys makes the contract independent of how the action happens to be
 * written.
 *
 * `data` is deliberately opaque — its shape differs between a real Resend
 * response and the honeypot/E2E short-circuits, and no caller reads it.
 */
export type SendEmailResult =
  { error: string; data?: undefined } | { data: unknown; error?: undefined };

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
