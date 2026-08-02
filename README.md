# Manvendra Rajpoot — Portfolio

[![CI](https://github.com/AlzyWelzy/rajpoot.dev/actions/workflows/ci.yml/badge.svg)](https://github.com/AlzyWelzy/rajpoot.dev/actions/workflows/ci.yml)

Personal portfolio of **Manvendra Rajpoot**, a Backend Developer. Built with a modern, SEO‑first SvelteKit stack and deployed to the edge on Cloudflare.

Live at **[rajpoot.dev](https://www.rajpoot.dev)**.

## Stack

- **SvelteKit 2** + **Svelte 5** (runes), fully prerendered
- **Cloudflare Workers** with static assets (`@sveltejs/adapter-cloudflare`)
- **TypeScript 6** (strict, `noUncheckedIndexedAccess`)
- **Tailwind CSS v4** with CSS‑first `@theme` config and dark mode variants
- **CSS-only animation** — keyframes, scroll-driven timelines, and two small actions; no animation library
- **Resend** for the contact form (dependency-free HTML + plaintext template)
- **Cloudflare Turnstile** for bot protection
- **Build-time image generation** (satori + resvg) for the OG card, touch icon and avatar ladder

Roughly 46KB of JavaScript reaches the browser on first load.

## SEO features

- Centralized site config (`src/lib/seo.ts`) feeding every metadata surface
- Full head metadata (OG, Twitter, canonical, robots, theme color)
- JSON‑LD structured data (`Person`, `WebSite`, `ProfilePage`, per-project nodes)
- `sitemap.xml`, `robots.txt` and the web app manifest as prerendered routes
- Open Graph image (1200×630), generated at build time
- Security headers on **every** response — pages, API, PDFs and redirects alike (CSP, HSTS, COOP/CORP, referrer policy, permissions policy)
- Accessibility: skip link, landmarks, aria labels, focus styles, `prefers-reduced-motion`

## Local development

```bash
pnpm install
pnpm dev
```

To exercise what actually ships — the Workers runtime, the static-asset pipeline and the generated `_headers` — use Wrangler rather than `pnpm preview`:

```bash
pnpm build
pnpm exec wrangler dev
```

`pnpm preview` runs the build through Vite, which reads neither `_headers` nor workerd, so security headers and Cloudflare asset semantics are both absent there.

## Deploying

```bash
pnpm deploy                                # build + wrangler deploy
wrangler secret put RESEND_API_KEY         # once, per secret
wrangler secret put TURNSTILE_SECRET_KEY
```

Apex → `www` is a Cloudflare Redirect Rule rather than anything in the app.

## Quality checks

The CI pipeline (`.github/workflows/ci.yml`) runs all of these on every push/PR:

```bash
pnpm lint          # ESLint
pnpm typecheck     # svelte-kit sync + svelte-check
pnpm format:check  # Prettier (pnpm format to fix)
pnpm test          # Vitest
pnpm test:coverage # ...with a coverage report in coverage/
pnpm test:e2e      # Playwright (Chromium, WebKit, mobile) against `wrangler dev`
```

Lighthouse CI also runs desktop and mobile audits against a production build, with enforced resource budgets (script/total transfer size). A husky pre-commit hook runs lint-staged (ESLint + Prettier on staged files). CodeQL and `pnpm audit` scan for vulnerabilities, and coverage thresholds are enforced in `vite.config.ts`.

Each CI job builds for itself. The build takes seconds, and an E2E build genuinely differs from a production one — it omits `upgrade-insecure-requests`, which WebKit applies to localhost and which would break every asset load under Playwright.

Visual regression baselines (`e2e/*-snapshots/`) are Linux-only and compared in CI; to regenerate them run the Playwright Docker image as described in `e2e/visual.spec.ts`.

Contributing to the code? [`AGENTS.md`](AGENTS.md) documents the architectural rules and the decisions that look like bugs until you know the reason for them.

## Generated files

`pnpm build` runs three generators before Vite:

- [`scripts/sync-build-meta.mjs`](scripts/sync-build-meta.mjs) derives the site's content-modified date from git history (feeding the sitemap's `lastmod` and JSON-LD's `dateModified`) and rolls the `Expires` field in `static/.well-known/security.txt` forward before it lapses. Both outputs are **committed** — run `pnpm sync:meta` to refresh them on their own.
- [`scripts/gen-images.mjs`](scripts/gen-images.mjs) renders the OG card, the Apple touch icon and the avatar's DPR ladder, and copies the latin subset of Inter to a stable path.
- [`scripts/gen-headers.mjs`](scripts/gen-headers.mjs) writes `_headers` from [`src/lib/security-headers.js`](src/lib/security-headers.js), the same module `hooks.server.ts` uses for Worker responses.

The last two produce gitignored build output and skip work when their inputs haven't changed.

## Documents

The resume / cover-letter PDFs served at `/resume`, `/cover_letter` and `/experience_letter` live in `static/`. Their LaTeX sources live in [`latex/`](latex/) — they are source files only and are not deployed.

## Environment variables

Copy [`.env.example`](.env.example) and split it by lifetime: build-time vars go in `.env.local` (and the CI build environment), runtime secrets go in `.dev.vars` locally and `wrangler secret put` in production. Everything is optional — the site builds and runs without any of it.

| Key                         | When    | Purpose                                                                                                                                                               |
| --------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`            | runtime | Sending messages from the contact form via Resend                                                                                                                     |
| `RESEND_FROM`               | runtime | Sender for contact emails, e.g. `Contact Form <contact@rajpoot.dev>`. Must be on a domain verified in Resend; falls back to the Resend sandbox sender if unset.       |
| `TURNSTILE_SECRET_KEY`      | runtime | Server-side Turnstile verification. Unset, the endpoint accepts unverified submissions and logs `contact.turnstile_unconfigured` — fine locally, never in production. |
| `PUBLIC_TURNSTILE_SITE_KEY` | build   | Public Turnstile key. Unset, the widget isn't rendered.                                                                                                               |
| `PUBLIC_ANALYTICS_ENDPOINT` | build   | Collector for custom events. Unset, `track()` is a no-op — see the Analytics section of `AGENTS.md`.                                                                  |
| `SHOW_TESTIMONIALS`         | build   | Set to `true` to render the testimonials section. Hidden by default until there are enough real endorsements.                                                         |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## Contact

[manvendra@rajpoot.dev](mailto:manvendra@rajpoot.dev)
