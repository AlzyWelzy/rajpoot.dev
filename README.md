# Manvendra Rajpoot — Portfolio

[![CI](https://github.com/AlzyWelzy/rajpoot.dev/actions/workflows/ci.yml/badge.svg)](https://github.com/AlzyWelzy/rajpoot.dev/actions/workflows/ci.yml)

Personal portfolio of **Manvendra Rajpoot**, a Backend Developer. Built with a modern, SEO‑first Next.js stack.

Live at **[rajpoot.dev](https://www.rajpoot.dev)**.

## Stack

- **Next.js 16** (App Router, Server Actions, Metadata API, OG image generation)
- **React 19**
- **TypeScript 6** (strict, `noUncheckedIndexedAccess`)
- **Tailwind CSS v4** with CSS‑first `@theme` config and dark mode variants
- **Motion** (the Framer Motion successor) for animations
- **React Email + Resend** for the contact form
- **Edge-rendered OG images** (`app/opengraph-image.tsx`)

## SEO features

- Centralized site config (`lib/seo.ts`)
- Full `Metadata` + `Viewport` objects (OG, Twitter, canonical, robots, theme color)
- JSON‑LD structured data (`Person`, `WebSite`, `ProfilePage`)
- Dynamic `app/sitemap.ts` and `app/robots.ts`
- Web App Manifest via `app/manifest.ts`
- Dynamic Open Graph image (1200×630)
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

Lighthouse CI also runs desktop and mobile audits against the production build. A husky pre-commit hook runs lint-staged (ESLint + Prettier on staged files).

## Documents

The resume / cover-letter PDFs served at `/resume`, `/cover_letter` and `/experience_letter` live in `public/`. Their LaTeX sources live in [`latex/`](latex/) — they are source files only and are not deployed.

## Environment variables

| Key                        | Purpose                                                                                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`           | Sending messages from the contact form via Resend                                                                                                                          |
| `RESEND_FROM`              | (Optional) Sender for contact emails, e.g. `Contact Form <contact@rajpoot.dev>`. Must be on a domain verified in Resend; falls back to the Resend sandbox sender if unset. |
| `UPSTASH_REDIS_REST_URL`   | (Optional) Upstash Redis URL — enables IP rate limiting on the contact form                                                                                                |
| `UPSTASH_REDIS_REST_TOKEN` | (Optional) Upstash Redis token — required alongside the URL for rate limiting                                                                                              |

Without the Upstash vars, production falls back to a best-effort per-instance in-memory rate limit and logs a warning — configure Upstash for real protection.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## Contact

[manvendra@rajpoot.dev](mailto:manvendra@rajpoot.dev)
