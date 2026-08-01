# AGENTS.md

Working notes for anyone — human or agent — making changes here. It documents
the decisions that aren't visible from the code alone, and the ones that look
like mistakes until you know why.

## What this is

A single-page portfolio site for Manvendra Rajpoot: Next.js 16 App Router,
React 19, Tailwind v4, deployed on Vercel. Every route is statically
prerendered. There is no database, no CMS and no authentication — the only
server-side behaviour is the contact form's server action and three PDF routes.

## Commands

```bash
pnpm dev            # dev server
pnpm build          # sync build metadata, then next build
pnpm lint           # ESLint
pnpm typecheck      # next typegen && tsc --noEmit
pnpm format         # Prettier write (format:check to verify)
pnpm test           # Vitest unit + component
pnpm test:coverage  # ...with thresholds enforced
pnpm test:e2e       # Playwright, against a real production build
pnpm sync:meta      # regenerate content date + security.txt Expires
```

`pnpm test:e2e` builds the site first. That takes a couple of minutes; there is
no dev-server shortcut, because several tests assert on production-only
behaviour (CSP headers, static prerendering, real React production mode).

## Architecture rules

**`lib/seo.ts` is the single source of truth for site identity.** Name, role,
URLs, social handles, location, employer, keywords. Metadata, JSON-LD, the
sitemap, the manifest and the OG image all read from it. Never hardcode any of
those values in a component.

**Content sections are server components.** `about`, `skills`, `projects`,
`experience` render on the server and wrap their content in
`components/section-spy.tsx`, a thin client component that owns the scroll-spy
ref and the optional reveal. Do not add `"use client"` to a section just to
observe it — that pulls all of its prose into the client bundle, which is
exactly what SectionSpy exists to prevent.

**Motion is loaded via `LazyMotion features={domAnimation} strict`.** Two
consequences: use `m.div`, never `motion.div` (strict mode throws), and do not
use layout animations (`layout`, `layoutId`) or drag — those need `domMax`,
which is roughly twice the size. The header's active pill deliberately measures
the active item and moves a CSS transform instead of using `layoutId`.

**Prefer CSS to JS for decorative animation.** The skill chips and the section
divider animate from `app/globals.css`, not motion. Anything scroll-driven must
be wrapped in `@supports (animation-timeline: view())` and must degrade to
_visible_, never to hidden.

## Things that look wrong but aren't

- **The Radixlink entry's title and dates differ from the experience letter
  PDF.** This is intentional. Don't "fix" it to match.
- **`components/project.tsx` uses a plain `<img>` with an eslint-disable.**
  next/image doesn't optimize SVGs, and every project logo is an SVG.
- **`serverExternalPackages` lists resend and its transitive deps.** Turbopack
  can't resolve some of `html-to-text`'s ESM sub-dependencies when bundled; the
  build breaks without this.
- **The CSP keeps `'unsafe-inline'` in `script-src`.** Next injects inline
  hydration scripts whose contents change every build. Removing it requires
  either per-request nonces (which force dynamic rendering and give up the
  static output the performance budget depends on) or a two-pass hash build.
  The protection comes from restricting sources instead — every unused sink is
  pinned to `'none'`. Don't "fix" this without addressing that trade-off.
- **`upgrade-insecure-requests` is dropped for `localhost` by host match.**
  WebKit applies the upgrade to localhost too, which breaks every asset load
  under Playwright's plain-http server. Matching on host rather than a build
  flag is what lets CI build once and share the artifact.
- **Coverage thresholds are 90%, not 100%.** They were 100%, and it showed:
  spec files existed only to render a component and assert nothing, and source
  carried `/* v8 ignore */` pragmas over defensive branches. Actual coverage
  sits around 96%. Add tests because they describe behaviour, not to move the
  number.

## Contact form

`actions/sendEmail.ts`. The order of operations matters and is deliberate:

1. Honeypot check — return a **fake success** so bots learn nothing.
2. Validation — cheap and synchronous, before spending a rate-limit token.
3. Rate limit — Upstash when configured, per-instance in-memory fallback
   otherwise.
4. `E2E_TESTING=1` short-circuit — validates fully, sends nothing.
5. Send via Resend; on failure log a structured event and return a generic
   message. Provider error text must never reach the client.

Two rate-limit budgets exist on purpose. Requests with a usable IP header get
5 per 10 minutes; requests without one all share a single `"anonymous"` key, so
they get a much wider window — applying the per-IP budget there would let one
script lock out every other header-less visitor.

Failures are reported through `lib/observability.ts` as single-line JSON with a
stable `event` field, because a log drain can alert on that and free text can't.
**Never put a message body or sender address in one of those lines.**

## Environment

Everything is optional; the site builds and runs without any of it.

| Key                                 | Effect if unset                                             |
| ----------------------------------- | ----------------------------------------------------------- |
| `RESEND_API_KEY`                    | Form validates, then returns a friendly error               |
| `RESEND_FROM`                       | Falls back to the Resend sandbox sender                     |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Per-instance in-memory rate limit + a warning event         |
| `SHOW_TESTIMONIALS`                 | Testimonials section hidden (default)                       |
| `E2E_TESTING`                       | Set by Playwright at runtime; skips the actual send         |
| `E2E_SKIP_BUILD`                    | Set by CI; reuse a `.next` restored from the build artifact |

## Generated files

`lib/generated/content-updated.ts` and the `Expires:` line in
`public/.well-known/security.txt` are written by `scripts/sync-build-meta.mjs`
and **are committed**. A fresh clone has to typecheck without running a build,
which rules out gitignoring them. The script only rewrites on real change, so
the churn is minimal. Don't edit either by hand.

The content date trails the commit that regenerates it by one, which is far
finer resolution than search engines treat the signal at.

## Version ceilings

TypeScript is held at 6.x and ESLint at 9.x — TS 7 and ESLint 10 both break the
Next toolchain. Both are encoded as `ignore` rules in `.github/dependabot.yml`;
if you lift a ceiling, remove the matching rule.

## Before you call it done

`pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build`, and
`pnpm test:e2e` for anything touching markup, headers or the form. Visual
snapshots are Linux-only and are compared in CI only — see `e2e/visual.spec.ts`
for how to regenerate them.
