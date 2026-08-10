# Manvendra Rajpoot — Portfolio

[![CI](https://github.com/AlzyWelzy/rajpoot.dev/actions/workflows/ci.yml/badge.svg)](https://github.com/AlzyWelzy/rajpoot.dev/actions/workflows/ci.yml)

Personal portfolio of **Manvendra Rajpoot**, a Backend Developer. Built with a modern, SEO‑first Next.js stack.

Live at **[rajpoot.dev](https://www.rajpoot.dev)**.

## Stack

- **Next.js 16** (App Router, Server Actions, Metadata API)
- **React 19**
- **TypeScript 6** (strict, `noUncheckedIndexedAccess`)
- **Tailwind CSS v4** with CSS‑first `@theme` config and dark mode variants
- **Motion** (the Framer Motion successor) for animations
- **Resend** for the contact form (dependency-free HTML + plaintext template)
- **Cloudflare Workers** deployment via the OpenNext adapter (`@opennextjs/cloudflare`)

## SEO features

- Centralized site config (`lib/seo.ts`)
- Full `Metadata` + `Viewport` objects (OG, Twitter, canonical, robots, theme color)
- JSON‑LD structured data (`Person`, `WebSite`, `ProfilePage`)
- Dynamic `app/sitemap.ts` and `app/robots.ts`
- Web App Manifest via `app/manifest.ts`
- Open Graph image (1200×630), pre-rendered at build time — see `pnpm generate:images` in [AGENTS.md](AGENTS.md)
- Preconfigured security headers (CSP, HSTS, COOP/CORP, referrer policy, permissions policy, etc.)
- Accessibility: skip link, landmarks, aria labels, focus styles, `prefers-reduced-motion`

## Local development

```bash
pnpm install
pnpm dev
```

Build locally:

```bash
pnpm build
pnpm start
```

## Quality checks

The CI pipeline (`.github/workflows/ci.yml`) runs all of these on every push/PR:

```bash
pnpm lint          # ESLint
pnpm typecheck     # next typegen + tsc --noEmit
pnpm format:check  # Prettier (pnpm format to fix)
pnpm test          # Vitest unit + component tests
pnpm test:coverage # ...with a coverage report in coverage/
pnpm test:e2e      # Playwright (Chromium, WebKit, mobile) against the prod build
```

Lighthouse CI also runs desktop and mobile audits against the production build, with enforced resource budgets (script/total transfer size). A husky pre-commit hook runs lint-staged (ESLint + Prettier on staged files). CodeQL and `pnpm audit` scan for vulnerabilities, and coverage thresholds are enforced in `vitest.config.ts`.

CI builds the site exactly once and shares the artifact with the E2E and Lighthouse jobs.

Visual regression baselines (`e2e/*-snapshots/`) are Linux-only and compared in CI; to regenerate them run the Playwright Docker image as described in `e2e/visual.spec.ts`.

Contributing to the code? [`AGENTS.md`](AGENTS.md) documents the architectural rules and the decisions that look like bugs until you know the reason for them.

## Generated metadata

`pnpm build` runs [`scripts/sync-build-meta.mjs`](scripts/sync-build-meta.mjs) first, which derives the site's content-modified date from git history (feeding the sitemap's `lastmod` and JSON-LD's `dateModified`) and rolls the `Expires` field in `public/.well-known/security.txt` forward before it lapses. Both outputs are committed; run `pnpm sync:meta` to refresh them on their own.

## Documents

The resume / cover-letter PDFs served at `/resume` (and its role variants at `/resume/devops_engineer`, `/resume/full_stack`, `/resume/software_engineer`), `/cover_letter` and `/experience_letter` live in `public/`. Their LaTeX sources live in [`latex/`](latex/) — they are source files only and are not deployed.

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local` and fill in what you need (`cp .env.example .env.local`). In production, set these via `wrangler secret put <NAME>` or the Cloudflare dashboard.

| Key                              | Purpose                                                                                                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`                 | Sending messages from the contact form via Resend                                                                                                                          |
| `RESEND_FROM`                    | (Optional) Sender for contact emails, e.g. `Contact Form <contact@rajpoot.dev>`. Must be on a domain verified in Resend; falls back to the Resend sandbox sender if unset. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key — gates the contact form. Without it the widget doesn't render and every submission fails verification; there is no fallback.                |
| `TURNSTILE_SECRET`               | Turnstile secret key, verified server-side via siteverify. Required alongside the site key.                                                                                |
| `TURNSTILE_HOSTNAMES`            | (Optional) Comma-separated hostnames siteverify must match. Defaults to `NEXT_PUBLIC_SITE_URL`'s host plus localhost/127.0.0.1.                                            |
| `NEXT_PUBLIC_SITE_URL`           | (Optional, build-time) Canonical URL for this deploy. Falls back to the current interim domain.                                                                            |
| `NEXT_PUBLIC_CF_BEACON_TOKEN`    | (Optional, build-time) Cloudflare Web Analytics site token. Beacon script isn't rendered if unset.                                                                         |
| `SHOW_TESTIMONIALS`              | (Optional, build-time) Set to `true` to render the testimonials section. Hidden by default until there are enough real endorsements.                                       |

Unlike the other optional vars above, Turnstile has no fallback: without both `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET`, the contact form always returns a "verification failed" error.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## Contact

[manvendra@rajpoot.dev](mailto:manvendra@rajpoot.dev)
