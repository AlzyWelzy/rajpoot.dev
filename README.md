# Manvendra Rajpoot — Portfolio

[![CI](https://github.com/AlzyWelzy/rajpoot.dev/actions/workflows/ci.yml/badge.svg)](https://github.com/AlzyWelzy/rajpoot.dev/actions/workflows/ci.yml)

Personal portfolio of **Manvendra Rajpoot**, a Backend Developer. Built with a modern, SEO‑first Astro stack and deployed to Cloudflare Workers.

Live at **[rajpoot.dev](https://www.rajpoot.dev)**.

## Stack

- **Astro 7** with `@astrojs/cloudflare` — native Cloudflare Workers adapter, real `workerd` runtime even in dev
- **Svelte 5** islands for the handful of genuinely interactive pieces (nav, contact form, theme toggle, toasts); everything else ships as zero-JS static HTML
- **TypeScript 6** (strict, `noUncheckedIndexedAccess`)
- **Tailwind CSS v4** with CSS‑first `@theme` config and dark mode variants
- Pure CSS scroll-driven animations (`animation-timeline: view()`/`scroll()`) for reveals, the reading-progress bar, and the scroll-to-top button — no animation library
- **Resend** for the contact form (dependency-free HTML + plaintext template), guarded by **Cloudflare Turnstile**
- **Astro Actions** for the contact form, backed by testable logic in `src/lib/contact.ts`
- Icons are build-time-static SVG imports from `lucide-static`/`simple-icons` — resolved once at build, no icon-component runtime

## SEO features

- Centralized site config (`src/lib/seo.ts`)
- Full metadata (OG, Twitter, canonical, robots, theme color) in `src/layouts/BaseLayout.astro`
- JSON‑LD structured data (`Person`, `WebSite`, `ProfilePage`) via `src/components/JsonLd.astro`
- `src/pages/sitemap.xml.ts` and `robots.txt.ts` endpoints
- Web App Manifest via `src/pages/manifest.webmanifest.ts`
- Build-time Open Graph image generation (`scripts/generate-static-images.mjs`, `@vercel/og`)
- Security headers (CSP, HSTS, COOP/CORP, referrer policy, permissions policy, etc.) via `public/_headers`
- Accessibility: skip link, landmarks, aria labels, focus styles, `prefers-reduced-motion`

## Local development

```bash
pnpm install
pnpm dev
```

Build and preview locally (real `workerd` via Wrangler, not a Node server):

```bash
pnpm build
pnpm preview
```

## Quality checks

The CI pipeline (`.github/workflows/ci.yml`) runs all of these on every push/PR:

```bash
pnpm lint          # ESLint
pnpm typecheck     # astro check
pnpm format:check  # Prettier (pnpm format to fix)
pnpm test          # Vitest unit + Svelte component tests
pnpm test:coverage # ...with a coverage report in coverage/
pnpm test:e2e      # Playwright (Chromium, WebKit, mobile) against a real wrangler dev build
```

Lighthouse CI also runs desktop and mobile audits against the production build, with enforced resource budgets (script/total transfer size). A husky pre-commit hook runs lint-staged (ESLint + Prettier on staged files). CodeQL and `pnpm audit` scan for vulnerabilities, and coverage thresholds are enforced in `vitest.config.ts`.

CI builds the site exactly once and shares the artifact with the E2E and Lighthouse jobs. The contact form's Turnstile-dependent E2E tests use Cloudflare's official always-pass testing sitekey/secret (baked into `playwright.config.ts`) — they don't need real credentials to run, locally or in CI.

Visual regression baselines (`e2e/*-snapshots/`) are Linux-only and compared in CI; to regenerate them run the Playwright Docker image as described in `e2e/visual.spec.ts`.

Contributing to the code? [`AGENTS.md`](AGENTS.md) documents the architectural rules and the decisions that look like bugs until you know the reason for them.

## Generated metadata

`pnpm build` runs [`scripts/sync-build-meta.mjs`](scripts/sync-build-meta.mjs) first, which derives the site's content-modified date from git history (feeding the sitemap's `lastmod` and JSON-LD's `dateModified`) and rolls the `Expires` field in `public/.well-known/security.txt` forward before it lapses. Both outputs are committed; run `pnpm sync:meta` to refresh them on their own.

## Documents

The resume / cover-letter PDFs served at `/resume`, `/cover_letter` and `/experience_letter` (plus role-specific resume variants) live in `public/` and are read through the Workers `ASSETS` binding in `src/lib/serve-pdf.ts`. Their LaTeX sources live in [`latex/`](latex/) — they are source files only and are not deployed.

## Environment variables

Two files, split by which system reads them:

- **`.env.local`** (Vite build-time, `import.meta.env.PUBLIC_*`) — copy [`.env.example`](.env.example)'s `PUBLIC_*` section.
- **`.dev.vars`** (Wrangler/Workers runtime, `cloudflare:workers`'s `env`) — copy the rest of `.env.example`.

In production, `PUBLIC_*` vars are set as GitHub Actions repo variables (see `deploy-cloudflare.yml`); runtime secrets are pushed once via `wrangler secret put <NAME> --name rajpoot-astro-portfolio` and persist across deploys.

| Key                         | File         | Purpose                                                                                                                                                                    |
| --------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`            | `.dev.vars`  | Sending messages from the contact form via Resend                                                                                                                          |
| `RESEND_FROM`               | `.dev.vars`  | (Optional) Sender for contact emails, e.g. `Contact Form <contact@rajpoot.dev>`. Must be on a domain verified in Resend; falls back to the Resend sandbox sender if unset. |
| `TURNSTILE_SECRET`          | `.dev.vars`  | Required to verify contact-form submissions server-side. Without it, every submission fails verification.                                                                  |
| `TURNSTILE_HOSTNAMES`       | `.dev.vars`  | (Optional) Comma-separated hostname override for Turnstile's siteverify check.                                                                                             |
| `PUBLIC_TURNSTILE_SITE_KEY` | `.env.local` | Public Turnstile site key — required for the widget to render at all.                                                                                                      |
| `PUBLIC_SITE_URL`           | `.env.local` | (Optional) Canonical URL for this deploy. Falls back to the current interim domain if unset.                                                                               |
| `PUBLIC_CF_BEACON_TOKEN`    | `.env.local` | (Optional) Cloudflare Web Analytics site token. Without it the beacon script isn't rendered.                                                                               |
| `SHOW_TESTIMONIALS`         | `.env.local` | (Optional, build-time) Set to `true` to render the testimonials section. Hidden by default until there are enough real endorsements.                                       |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## Contact

[manvendra@rajpoot.dev](mailto:manvendra@rajpoot.dev)
