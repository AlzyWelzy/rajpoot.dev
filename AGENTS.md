# AGENTS.md

Working notes for anyone — human or agent — making changes here. It documents
the decisions that aren't visible from the code alone, and the ones that look
like mistakes until you know why.

## What this is

A single-page portfolio site for Manvendra Rajpoot: SvelteKit 2, Svelte 5,
Tailwind v4, deployed on Cloudflare Workers with static assets. Every page is
prerendered at build time and **ships no framework JavaScript** — see
"Architecture rules". There is no database, no CMS and no authentication; the
only server-side behaviour is the contact endpoint and three PDF routes.

The whole critical path is about 47KB: 18KB of HTML with the CSS inlined, 25KB
webfont, 2.3KB of progressive-enhancement script, 1.3KB avatar.

It was a Next.js 16 / React 19 app on Vercel until the rewrite. A lot of the
comments in this repo say "this used to be X" — that history is kept where it
explains a non-obvious present-day choice, and deleted where it doesn't.

## Commands

```bash
pnpm dev            # vite dev server
pnpm build          # sync metadata, generate images + _headers, vite build
pnpm preview        # vite preview (no Worker, no _headers — see below)
pnpm deploy         # build + wrangler deploy
pnpm lint           # ESLint
pnpm typecheck      # svelte-kit sync && svelte-check
pnpm format         # Prettier write (format:check to verify)
pnpm test           # Vitest
pnpm test:coverage  # ...with thresholds enforced
pnpm test:e2e       # Playwright, against `wrangler dev`
pnpm sync:meta      # regenerate content date + security.txt Expires
```

**`pnpm preview` is not the deployed shape.** It serves the build through Vite,
which does not read `_headers` and does not run workerd — so no security
headers, and no Cloudflare asset semantics. Use `pnpm exec wrangler dev` when
any of that matters. `pnpm test:e2e` already does.

## Architecture rules

**`src/lib/seo.ts` is the single source of truth for site identity.** Name,
role, URLs, social handles, location, employer, keywords. Head metadata,
JSON-LD, the sitemap, the manifest and the OG image all read from it. Never
hardcode any of those values in a component. `src/lib/data.ts` re-exports
`emailId` from it rather than restating the address, and `src/lib/redirects.ts`
takes the social shortlink destinations from it rather than keeping a second
copy. There are two role strings on purpose: `roleline` is the full headline
for the OG card, and `roleShort` is the condensed one for the `<title>`, which
search engines truncate around 60 characters.

**`src/lib/security-headers.js` is the single source of truth for headers**, and
it is deliberately `.js` rather than `.ts` — `scripts/gen-headers.mjs` imports
it at build time to emit `_headers`, and a build script can't import TypeScript
without a compile step. See "Two serving paths" below for why it has two
consumers at all.

**`csr = false`. Svelte does not run in the browser at all.** This is the rule
everything else in this section follows from, and the easiest one to break by
accident. SvelteKit prerenders the site and ships **no** framework runtime, no
client router and no hydration; Svelte is the templating language, nothing more.

The router is what made this worth doing: ~12KB brotli of navigation,
preloading and scroll-restoration on a single page whose every link is a hash
anchor or an external URL. Hydration cost another ~19KB re-deriving markup
identical to what was already served.

**All interactivity lives in `src/lib/enhance/`** — one esbuild bundle (~2KB
brotli) that finds its own markup by data attribute. Consequences, in order of
how likely they are to bite:

- **Markup must be complete and usable in the server-rendered HTML.** Nothing in
  that bundle renders UI. The scroll-to-top button ships `hidden`, the toast
  region ships empty, the contact form ships with a real `action`/`method` so it
  still POSTs without JavaScript. If you find yourself wanting to create an
  element from script, render it in the component and toggle it instead.
- **No `$state`, `$effect` or event handlers in components.** They compile away
  to nothing. Use a `data-` attribute and handle it in `enhance/`.
- **Adding an interactive behaviour means editing two files** — the component,
  for the markup and the attribute, and an `enhance/` module for the behaviour.
- `scripts/gen-enhance.mjs` **fails the build above 20KB.** If the site genuinely
  needs more client code than that, reconsider the architecture rather than
  raising the number.

**Prefer CSS to script for anything derived from DOM state.** The theme icons
are the model: which one shows is driven entirely by `html.dark`, which
app.html's inline script sets _before first paint_, so the right icon paints
immediately rather than after a swap. The nav's active item works the same way
off `data-active`. This is strictly better than the reactive version was, not a
compromise.

**Animation is CSS, not a library.** motion/framer is gone. Entrance animations
are keyframes in `app.css`, scroll reveals toggle one class, and the
reading-progress bar is a scroll-driven CSS animation that never touches the
main thread. Anything scroll-driven must be wrapped in
`@supports (animation-timeline: view())`.

**Every reveal degrades to _visible_, never to hidden.** A hard rule, with specs
enforcing it at both levels. `enhance/reveal.ts` hides an element only after
confirming it can also un-hide it (script running, `IntersectionObserver`
present, reduced motion not requested). The React version declared
`initial={{ opacity: 0 }}` in the markup, so a hydration failure left the
section permanently invisible. Author the settled state; let the animation
remove a temporary starting state.

## Two serving paths

This is the thing most likely to trip you up.

Cloudflare answers this site from **two** places, and they have different header
mechanisms:

| Path                                                             | Served by        | Headers from      |
| ---------------------------------------------------------------- | ---------------- | ----------------- |
| `/`, static files, shortlink redirects                           | the asset server | `_headers`        |
| `/api/contact`, `/resume`, `/cover_letter`, `/experience_letter` | the Worker       | `hooks.server.ts` |

The asset server answers straight from edge cache **without waking the Worker**.
That is the entire TTFB win of the move and must not be given up — there is
deliberately no `run_worker_first` in `wrangler.jsonc`. The cost is that headers
have two emitters, so both read from `src/lib/security-headers.js` and
`e2e/security.spec.ts` asserts the full set on one path of each kind.

## Things that look wrong but aren't

- **The Radixlink entry's title and dates differ from the experience letter
  PDF.** This is intentional. Don't "fix" it to match.
- **`src/lib/icons/*.svelte` are generated, verbatim, from react-icons.** The
  geometry was extracted from the package so dropping the dependency changed no
  pixels. Each file says which pack and icon it came from. Hand-edit at your
  peril; prefer re-extracting.
- **The contact email is a string template, not a component.**
  `src/lib/email/contact-form-email.ts` returns `{ html, text }`. It was a
  `react-email` component; that was an entire rendering runtime for one static
  template, and the string version also produces a real `text/plain` part, which
  the React path never did. Both fields are interpolated from untrusted form
  input, so the HTML side escapes everything. **Don't drop `escapeHtml`.**
- **`script-src` keeps `'unsafe-inline'`.** Two inline scripts exist: the
  pre-paint theme setter in `app.html`, and SvelteKit's hydration bootstrap,
  whose contents change every build. Removing it needs per-request nonces (which
  force dynamic rendering and give up the prerendered output the performance
  budget depends on) or a two-pass hash build. The protection comes from
  restricting sources instead — only Turnstile and Cloudflare's beacon may load
  script at all, and every unused sink is pinned to `'none'`.
- **`frame-src` is not `'none'`.** It was, until the contact form moved to
  Turnstile, which renders its challenge in an iframe. It is scoped to exactly
  `https://challenges.cloudflare.com` and there is a spec asserting it stays
  that narrow.
- **`upgrade-insecure-requests` is decided at _build_ time, not per request.**
  WebKit applies it to localhost too, which rewrites every asset URL to https
  and breaks the page under Playwright's plain-http server. Under Next this was
  a per-request host match; `_headers` is a static file, so `gen-headers.mjs`
  keys it off `E2E_TESTING` instead. The consequence is that an E2E build and a
  production build are **not** the same artifact — which is why CI builds twice
  and why `src/lib/security-headers.test.ts` asserts the production form.
- **The OG image and apple-touch-icon are build outputs, not routes.** They were
  `ImageResponse` routes on Vercel. Nothing about them is per-request, so
  `scripts/gen-images.mjs` renders them once with satori + resvg. Same for the
  avatar's DPR ladder, which next/image used to resize on demand.
- **`app.css` declares `@font-face` by hand** instead of importing
  `@fontsource-variable/inter`. That entry point pulls in all seven subsets —
  ~170KB of woff2 in the deployment and seven `@font-face` blocks in the
  critical inlined CSS. The site's copy is latin-only. This is what
  `next/font`'s `subsets: ["latin"]` was expressing.
- **The PDFs carry `X-Robots-Tag: noindex` in two places.**
  `src/lib/serve-pdf.ts` sets it for `/resume` and friends; a `/*.pdf` rule in
  the generated `_headers` covers the raw `static/` filenames, which bypass the
  route handler completely. Removing either one reopens the gap. It is
  deliberately not a robots.txt `Disallow` — a blocked URL is never fetched, so
  the crawler never sees the noindex and can still list it.
- **`serve-pdf.ts` fetches the file instead of reading it.** There is no
  filesystem on a Worker. It uses the `ASSETS` binding in production and
  `event.fetch` in dev, where that binding doesn't exist.
- **`src/lib/enhance/` is plain TS, not Svelte.** It is bundled by esbuild
  outside SvelteKit's Vite pipeline, so `$env/*` and `$lib/*` are unavailable to
  it: build-time values arrive through esbuild `define` (see
  `__ANALYTICS_ENDPOINT__`) and per-deploy values through `data-` attributes
  (see the Turnstile site key). Its tests are named `*.svelte.test.ts` purely to
  land in the jsdom Vitest project; there is no Svelte in them.
- **Coverage thresholds are 85–90, not 100.** They were 100 once, and it showed:
  spec files existed only to render a component and assert nothing. Add tests
  because they describe behaviour, not to move the number.

## Contact form

`src/routes/api/contact/+server.ts`. The order of operations matters and is
deliberate:

1. Honeypot check — return a **fake success** so bots learn nothing.
2. Validation — cheap and synchronous, before spending a Turnstile round trip.
3. Turnstile verification — fails **closed**; an unreachable siteverify is
   exactly the condition an attacker would try to manufacture.
4. `E2E_TESTING=1` short-circuit — validates fully, sends nothing.
5. Render `contact-form-email.ts` and send both parts via Resend; on failure log
   a structured event and return a generic message. Provider error text must
   never reach the client.

**Turnstile replaced an Upstash sliding-window IP limit.** That limit could only
count requests — five per IP per ten minutes — which costs a determined spammer
one proxy rotation and costs a legitimate visitor behind shared CGNAT their
fourth message. Turnstile scores the client instead, so it survives IP rotation
and stops charging real people for their neighbours' behaviour. It also removed
an external database, and its cross-region round trip, from the submit path.

**The widget loads on first interaction with the form, not on mount.** It is the
only third-party script on the site and the form is at the bottom of a long
page; loading it eagerly would put a cross-origin request on the critical path
of every visitor, almost none of whom reach the form.

Failures are reported through `src/lib/observability.ts` as single-line JSON with
a stable `event` field, which Workers Logs indexes and can alert on. **Never put
a message body or sender address in one of those lines.**

## Environment

Everything is optional; the site builds and runs without any of it. Note the
split — build-time vars go in the build environment, runtime secrets go in
`.dev.vars` locally and `wrangler secret put` in production.

| Key                         | When       | Effect if unset                                                          |
| --------------------------- | ---------- | ------------------------------------------------------------------------ |
| `RESEND_API_KEY`            | runtime    | Form validates, then returns a friendly error                            |
| `RESEND_FROM`               | runtime    | Falls back to the Resend sandbox sender                                  |
| `TURNSTILE_SECRET_KEY`      | runtime    | Submissions accepted unverified + warn event                             |
| `PUBLIC_TURNSTILE_SITE_KEY` | build      | Widget not rendered at all                                               |
| `PUBLIC_ANALYTICS_ENDPOINT` | build      | Custom events no-op (see below)                                          |
| `SHOW_TESTIMONIALS`         | build      | Testimonials section hidden (default)                                    |
| `E2E_TESTING`               | both       | Build: drops `upgrade-insecure-requests`. Runtime: skips the actual send |
| `E2E_SKIP_BUILD`            | local only | Reuse an existing E2E build instead of rebuilding                        |

## Analytics

`@vercel/analytics` is gone. Cloudflare Web Analytics is the like-for-like
replacement for pageviews, but it is **pageview only** — it has no custom-event
API, so the site's five events (CTA click, CV download, social click, project
click, contact submit) have no direct platform equivalent.

`src/lib/analytics.ts` keeps the `track()` call sites intact and posts to
`PUBLIC_ANALYTICS_ENDPOINT` when one is configured. Unset, every call is a
no-op — which is the current deployed state. To restore the events, point that
at any collector accepting a JSON POST; a Worker writing to Analytics Engine is
the cheap native option.

## Deploying

```bash
pnpm deploy                            # build + wrangler deploy
wrangler secret put RESEND_API_KEY     # once, per secret
wrangler secret put TURNSTILE_SECRET_KEY
```

DNS lives on Cloudflare already. Both apex and `www` should be proxied records
pointing at the Worker, with **apex → www as a Cloudflare Redirect Rule**.

That redirect is worth understanding. On Vercel it had to be a platform-level
domain redirect, because Next applied neither `headers()` nor the CSP to a
redirect response — so that hop answered with a bare
`Strict-Transport-Security` missing `includeSubDomains; preload`, and the domain
**could not be submitted to hstspreload.org**. Here `_headers` covers redirect
responses, so the full set rides along and that blocker is gone. Submit the
domain once the redirect is in place and verified.

## Generated files

Written by scripts, **committed**: `src/lib/generated/content-updated.ts` and
the `Expires:` line in `static/.well-known/security.txt`
(`scripts/sync-build-meta.mjs`). A fresh clone has to typecheck without running
a build, which rules out gitignoring them. The scripts only rewrite on real
change, so churn is minimal. Don't edit either by hand.

Written by scripts, **gitignored**: `_headers` (`scripts/gen-headers.mjs`), and
the avatar ladder, OG image, apple icon and copied webfont in `static/`
(`scripts/gen-images.mjs`). These are pure build outputs and are regenerated
on every build, skipping work when inputs haven't changed.

The content date trails the commit that regenerates it by one, which is far
finer resolution than search engines treat the signal at.

## Version ceilings

TypeScript is held at 6.x — TS 7 breaks the toolchain. Encoded as an `ignore`
rule in `.github/dependabot.yml`; if you lift the ceiling, remove the rule. The
ESLint 9 ceiling is gone: it existed for `eslint-config-next`, which no longer
exists here.

## Before you call it done

`pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build`, and
`pnpm test:e2e` for anything touching markup, headers or the form. Visual
snapshots are Linux-only and are compared in CI only — see `e2e/visual.spec.ts`
for how to regenerate them.
