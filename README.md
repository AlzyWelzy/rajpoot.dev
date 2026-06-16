# Manvendra Rajpoot — Portfolio

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
- Preconfigured security headers (HSTS, referrer policy, permissions policy, etc.)
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

## Environment variables

| Key | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Sending messages from the contact form via Resend |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | (Optional) Google Search Console verification token |

## Contact

[manvendra@rajpoot.dev](mailto:manvendra@rajpoot.dev)
