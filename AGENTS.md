# AGENTS.md

Working notes for anyone — human or agent — making changes here. It documents
the decisions that aren't visible from the code alone, and the ones that look
like mistakes until you know why.

## What this is

A single-page portfolio site for Manvendra Rajpoot: Astro 7, Tailwind v4,
no UI framework at all, deployed on Cloudflare Workers via `@astrojs/cloudflare` (native
adapter, real `workerd` runtime — including in `astro dev`, not a shim).
There is no database, no CMS and no authentication — the only server-side
behaviour is the contact form's Astro Action and six PDF endpoints.

The site was rewritten from Next.js + React in place on this branch, then
had Svelte removed too. React, `motion`, `react-icons` and Svelte are all
gone: every page is static HTML, and the four interactive pieces (nav,
contact form, theme toggle, toasts) are plain `<script>` blocks in `.astro`
files. There is no hydration and no `client:*` directive anywhere.

**No UI framework — and don't reintroduce one.** The site is ~95% static
prose with four small stateful widgets. Svelte was used for those initially;
removing it cut client JS from 28.2 KB to 7.4 KB gzip (-74%), because its
runtime alone was 16.4 KB — more than twice the weight of all the site's own
code combined. Nothing here re-renders lists or trees, so the thing a
framework buys you was never being used. If a future feature genuinely needs
declarative rendering, measure the runtime cost against that 7.4 KB baseline
before adding it back.

## Commands

```bash
pnpm dev              # astro dev (real workerd, not a Node dev server)
pnpm build            # sync build metadata, then astro build
pnpm preview          # astro build && wrangler dev
pnpm lint             # ESLint
pnpm typecheck        # astro check
pnpm format           # Prettier write (format:check to verify)
pnpm test             # Vitest unit + DOM (jsdom) tests
pnpm test:coverage    # ...with thresholds enforced
pnpm test:e2e         # Playwright, against a real wrangler dev build
pnpm sync:meta        # regenerate content date + security.txt Expires
pnpm cf-typegen       # regenerate worker-configuration.d.ts (gitignored)
pnpm generate:images  # regenerate OG/apple-touch-icon PNGs (see below)
pnpm deploy           # astro build && wrangler deploy
```

`pnpm test:e2e` builds the site first (`astro build && wrangler dev`). There
is no `astro dev`-based shortcut: the adapter's dev-mode ASSETS binding does
not reliably serve `public/` files to server-side `env.ASSETS.fetch()` calls
the way the real built+deployed Worker does (confirmed empirically — the PDF
routes 404 under `astro dev` but work under `wrangler dev` against the same
build). Always verify Workers-runtime behaviour against a real `wrangler dev`
or a real deploy, not `astro dev` alone.

## Architecture rules

**`src/lib/seo.ts` is the single source of truth for site identity.** Name,
role, URLs, social handles, location, employer, keywords. Metadata, JSON-LD,
the sitemap, the manifest and the OG image all read from it. Never hardcode
any of those values in a component. `src/lib/data.ts` re-exports `emailId`
from it rather than restating the address. There are two role strings on
purpose: `roleline` is the full headline for the OG card, and `roleShort` is
the condensed one for the `<title>`, which search engines truncate around 60
characters.

**Everything is a plain `.astro` component with an optional `<script>`.**
Interactive behaviour lives in Header (active-pill measurement), Contact
(form submit + pending/error state), ThemeSwitch (icon swap) and Toast
(builds/removes toast nodes). Each queries its own DOM by `id`, so the
markup ships server-rendered and the script only wires behaviour onto it —
the page is fully readable and navigable before any JS runs.

**Shared state lives in `src/lib/stores/*.ts` as plain observables.** Each
exports an object with a `value` (or `items`) accessor plus a `subscribe*`
function returning an unsubscribe — a `Set` of callbacks is the entire
mechanism. The accessor-object shape matters: ESM live bindings can't be
written through from an importing module, so a bare exported `let` would
silently fail to propagate. A store
file's top-level side effects (the `active-section` store's `scrollend`
listener, the `theme` store's `matchMedia`/`storage` listeners) run once, at
first import — do not wrap them in a function expecting them to re-run per
consumer.

**Prefer CSS to JS for decorative animation.** Scroll-triggered reveals
(`.section-reveal`, `.chip-reveal`, `.card-reveal`, `.fade-reveal`), the
reading-progress bar, and the scroll-to-top button's visibility are all pure
`animation-timeline: view()`/`scroll()` CSS in `src/styles/global.css` — no
JS at all, not even in an island. Anything scroll-driven must be wrapped in
`@supports (animation-timeline: …)` and must degrade to _visible_ (or, for
the reading-progress bar / scroll-to-top button, to its unconditionally-safe
default state), never to permanently hidden.

**Icons are build-time-static SVG, not a component library.**
`src/lib/icons.ts` imports raw `.svg` files from `lucide-static` (generic UI
icons) and `simple-icons` (brand marks) via Vite's `?raw` suffix, and
`src/components/Icon.astro` string-injects `class`/`aria-hidden` into the
source markup. **Do not reach for `astro-icon`** — its default loader shells
out via `node:child_process` and reads the filesystem at request time to
detect installed icon collections, which crashes under the real Cloudflare
Workers runtime (`Internal server error: module is not defined`, confirmed
under `astro dev`). LinkedIn isn't in either icon package (simple-icons
dropped it at some point); its path in `icons.ts` is hand-authored, styled to
match its `simple-icons` siblings.

**Whitespace across an Astro tag boundary is not HTML's whitespace
model.** Plain HTML collapses `text\n<tag>` to `text <tag>`; Astro's
compiler instead trims that newline-and-indentation away to
_nothing_ when a tag starts a fresh line. This produced several real,
silent-until-screenshotted bugs during the rewrite (`"specializing
inAI automation"`, `"that arescalable"`, `"directly atmanvendra@…"`). The
fix is to keep the tag on the **same source line** as the word before it
whenever a literal space matters (`text <span>`, not `text\n<span>`) — it
does not matter when the two elements are separated by CSS `gap` (flex/grid
children don't need a text-space between them at all). When editing prose
across a tag boundary, sanity-check the rendered `curl`/screenshot output,
don't trust that the source "looks like" it has a space.

## Things that look wrong but aren't

- **The Radixlink entry's title and dates differ from the experience letter
  PDF.** This is intentional. Don't "fix" it to match.
- **`src/actions/index.ts` is a ~15-line wrapper; the real logic lives in
  `src/lib/contact.ts`.** Astro Actions run through request-scoped
  machinery (`ActionAPIContext`) that isn't meant to be invoked directly
  outside a real request, which makes the handler itself hard to unit test.
  The split lets `submitContactForm(formData, request)` be tested directly
  (see `src/lib/contact.test.ts`) while `defineAction`'s handler stays a
  thin translation from its `ContactResult` union to `ActionError`.
- **`getFromAddress()`/`getExpectedHostnames()` in `src/lib/contact.ts` are
  functions, not module-scope constants.** Reading `env` fresh on every call
  (rather than once at import time) is what lets tests mutate a single mock
  `env` object between cases without `vi.resetModules()` — and is also just
  more correct, since Workers keep a module warm across requests.
- **The contact email is a string template, not a component.**
  `src/email/contact-form-email.ts` returns `{ html, text }` built by hand.
  Both fields are interpolated from untrusted form input, so the HTML side
  escapes everything explicitly. **Don't drop `escapeHtml`.**
- **The PDFs carry `X-Robots-Tag: noindex` in two places.**
  `src/lib/serve-pdf.ts` sets it for `/resume` and friends; a `/*.pdf` rule
  in `public/_headers` covers the raw `public/` filenames, which bypass the
  endpoint completely. Removing either one reopens the gap. It is
  deliberately not a `robots.txt` `Disallow` — a blocked URL is never
  fetched, so the crawler never sees the noindex and can still list it.
- **The CSP keeps `'unsafe-inline'` in `script-src`/`style-src`.** Astro's
  pre-hydration theme script and its per-component inline styles have
  contents that change per build. Removing it needs
  per-request nonces, which would force dynamic rendering and give up the
  fully-static output. The protection comes from restricting _sources_
  instead — every unused sink is pinned to `'none'`.
- **`upgrade-insecure-requests` is dropped from the CSP entirely — not
  host-matched like it briefly was pre-rewrite.** Every directive in
  `public/_headers`'s CSP already allows only `'self'` or explicit `https://`
  origins, so there is no `http:` source this policy could ever request in
  the first place — the directive is pure redundancy here. Dropping it also
  sidesteps WebKit upgrading `http://localhost` asset requests during
  Playwright runs, without needing a second build variant or a host-match
  rule.
- **`public/_headers` and `public/_redirects` apply to static Workers Assets
  responses with _zero_ Worker invocation** — confirmed by a real deploy
  (`curl -I` against a static page showed the custom header with the Worker
  never running). This is a real architectural win over a Next-on-Workers
  setup, which had to route every request through the Worker to attach
  headers.
- **`.wrangler/deploy/config.json` has to travel with `dist/` in CI.**
  `wrangler dev`/`deploy`'s "redirected configuration" (the mechanism that
  makes the root `wrangler.jsonc`'s placeholder `main` field resolve to the
  real built entry) is pointed to by this file, which `astro build` writes
  _outside_ `dist/`. A CI artifact that only captures `dist/` builds fine but
  fails every job that runs `wrangler dev` against the restored artifact with
  `The entry-point file at "@astrojs/cloudflare/entrypoints/server" was not
found` — see `.github/workflows/ci.yml`'s upload/download steps.
- **`worker-configuration.d.ts` is gitignored and regenerated on demand**
  (`pnpm cf-typegen`, i.e. `wrangler types`) — it declares the
  `cloudflare:workers` module and the `Env` interface from `.dev.vars`. A
  fresh CI checkout needs this generated _before_ `astro check`, or every
  `cloudflare:workers` import fails to typecheck.
- **`scripts/generate-static-images.mjs` bundles `scripts/og-image.mjs`/
  `apple-icon.mjs` with esbuild, not Vite.** Those two files build plain
  `{ type, props }` object trees via `scripts/og-h.mjs`'s tiny `h()` helper
  — no JSX, no React — because `@vercel/og`'s `ImageResponse` (Satori) only
  needs a React-element-_shaped_ object, not React itself. The script's
  esbuild `define` shims `import.meta.env.PUBLIC_SITE_URL`/
  `PUBLIC_TURNSTILE_SITE_KEY` from `process.env`, since Vite-style
  `import.meta.env` replacement doesn't exist outside an actual Vite build.
  Run manually with `pnpm generate:images` after changing either source and
  commit the result — this mirrors `sync-build-meta.mjs`'s
  generated-but-committed outputs.
- **Coverage thresholds (90%) exclude the components' `<script>` blocks and
  `src/actions/index.ts`.** They're UI/wiring, not logic, and a `<script>`
  inside an `.astro` file can't be imported by Vitest anyway. Playwright is
  the real safety net there — `e2e/portfolio.spec.ts` covers the theme
  toggle and scroll-spy, `e2e/contact.spec.ts` the form and Action wiring;
  see `vitest.config.ts`'s `coverage.include` for the current scope.

## Contact form

`src/lib/contact.ts`'s `submitContactForm`. The order of operations matters
and is deliberate:

1. Honeypot check — return a **fake success** so bots learn nothing.
2. Validation — cheap and synchronous, before spending a Turnstile round trip.
3. Turnstile `siteverify` — action/hostname checks are skipped for
   Cloudflare's testing sitekey/secret pair (`metadata.result_with_testing_key
=== true`), since testing-key responses always report a fixed hostname
   (`example.com`) and no action regardless of the real page.
4. `E2E_TESTING=1` short-circuit — validates and verifies Turnstile fully,
   sends nothing.
5. Render `src/email/contact-form-email.ts` and send both parts via Resend;
   on failure log a structured event and return a generic message. Provider
   error text must never reach the client.

Failures are reported through `src/lib/observability.ts` as single-line JSON
with a stable `event` field, because a log drain can alert on that and free
text can't. **Never put a message body or sender address in one of those
lines.**

Playwright's Turnstile-dependent tests (`e2e/contact.spec.ts`) and the shared
CI build both use Cloudflare's official always-pass testing sitekey/secret
pair, baked directly into `playwright.config.ts` and `.github/workflows/
ci.yml` — not read from `.env.local`/`.dev.vars`. This is deliberate: the
_real_ production sitekey triggers an actual interactive Turnstile challenge
for headless/datacenter-IP automation, which never resolves and hangs the
test (confirmed empirically). Don't swap these for real-looking values "to
be safe" — the testing pair is what makes E2E deterministic.

## Environment

Everything is optional except Turnstile; the site builds and runs without
the rest. Split across two files — see `.env.example` for the full list and
`README.md`'s table for which file each key belongs in:

- **`.env.local`** — Vite build-time, `import.meta.env.PUBLIC_*`.
- **`.dev.vars`** — Wrangler/Workers runtime, `cloudflare:workers`'s `env`.

`RESEND_API_KEY` unset → form validates and passes Turnstile, then returns a
friendly error instead of sending. `TURNSTILE_SECRET` unset → every
submission fails verification (there is no fallback path for this one).
`E2E_TESTING`/`E2E_SKIP_BUILD` are set by tooling (Playwright, CI) — don't
set them by hand.

## Generated files

`src/lib/generated/content-updated.ts` and the `Expires:` line in
`public/.well-known/security.txt` are written by `scripts/sync-build-meta.mjs`
and **are committed**. A fresh clone has to typecheck without running a
build, which rules out gitignoring them. The script only rewrites on real
change, so the churn is minimal. Don't edit either by hand — and if you move
`src/lib`, `src/pages`, or `src/components` again, update
`CONTENT_PATHS`/`GENERATED_PATH` in the script; it silently writes to
whatever path it's given even if nothing imports it from there anymore (this
happened once already, during the Astro rewrite).

The content date trails the commit that regenerates it by one, which is far
finer resolution than search engines treat the signal at.

## Version ceilings

TypeScript is held at 6.x — `typescript-eslint` (and so `eslint-plugin-astro`)
caps its `typescript` peer dependency at `<6.1.0`. Encoded as an
`ignore` rule in `.github/dependabot.yml`; if you lift the ceiling, remove
the matching rule. ESLint itself is _not_ held back on this stack —
`eslint-plugin-astro` actually requires `>=10`, the opposite constraint from
the old Next toolchain.

## Before you call it done

`pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build`, and
`pnpm test:e2e` for anything touching markup, headers, islands, or the form.
For anything touching Workers-runtime behaviour specifically (bindings,
`env`, `_headers`/`_redirects`), verify against `pnpm preview`
(`wrangler dev`) or a real deploy — `astro dev` alone is not trustworthy for
that (see the ASSETS-binding note under Commands). Visual snapshots are
Linux-only and are compared in CI only — see `e2e/visual.spec.ts` for how to
regenerate them.
