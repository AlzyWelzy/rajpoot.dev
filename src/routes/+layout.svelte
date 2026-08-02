<script lang="ts">
  import type { Snippet } from "svelte";

  import "../app.css";

  import Footer from "$lib/components/Footer.svelte";
  import Header from "$lib/components/Header.svelte";
  import ReadingProgress from "$lib/components/ReadingProgress.svelte";
  import ScrollToTop from "$lib/components/ScrollToTop.svelte";
  import ThemeSwitch from "$lib/components/ThemeSwitch.svelte";
  import Toaster from "$lib/components/Toaster.svelte";
  import { buildJsonLd } from "$lib/json-ld";
  import { siteConfig } from "$lib/seo";
  import { activeSection } from "$lib/state/active-section.svelte";
  import { theme } from "$lib/state/theme.svelte";

  let { children }: { children: Snippet } = $props();

  const jsonLd = buildJsonLd();

  const title = `${siteConfig.name} — ${siteConfig.roleShort} | Portfolio`;
  const ogTitle = `${siteConfig.name} — ${siteConfig.jobTitle}`;
  const ogImage = `${siteConfig.url}${siteConfig.ogImage}`;

  // The two ambient listeners the React context providers used to own. They
  // are page-lifetime, so the layout is the right place for them.
  $effect(() => theme.listen());
  $effect(() => activeSection.listen());
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={siteConfig.description} />
  <meta name="application-name" content="{siteConfig.name} Portfolio" />
  <meta name="keywords" content={siteConfig.keywords.join(", ")} />
  <meta name="author" content={siteConfig.name} />
  <meta name="creator" content={siteConfig.name} />
  <meta name="publisher" content={siteConfig.name} />
  <link rel="canonical" href="{siteConfig.url}/" />

  <meta
    name="robots"
    content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
  />

  <meta property="og:type" content="website" />
  <meta property="og:locale" content={siteConfig.locale} />
  <meta property="og:url" content={siteConfig.url} />
  <meta property="og:site_name" content="{siteConfig.name} — Portfolio" />
  <meta property="og:title" content={ogTitle} />
  <meta property="og:description" content={siteConfig.description} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={ogTitle} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content={siteConfig.twitter} />
  <meta name="twitter:creator" content={siteConfig.twitter} />
  <meta name="twitter:title" content={ogTitle} />
  <meta name="twitter:description" content={siteConfig.description} />
  <meta name="twitter:image" content={ogImage} />

  <link rel="icon" href="/favicon.ico" sizes="48x48" />
  <link rel="icon" href="/icon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/apple-icon.png" sizes="180x180" />
  <link rel="manifest" href="/manifest.webmanifest" />

  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content={siteConfig.shortName} />
  <meta
    name="apple-mobile-web-app-status-bar-style"
    content="black-translucent"
  />
  <meta
    name="format-detection"
    content="telephone=no,date=no,address=no,email=no"
  />

  <meta name="color-scheme" content="light dark" />
  <meta
    name="theme-color"
    media="(prefers-color-scheme: light)"
    content="#fbe2e3"
  />
  <meta
    name="theme-color"
    media="(prefers-color-scheme: dark)"
    content="#0b1020"
  />

  <!--
    The CSS is inlined into this document, so nothing else would discover the
    webfont until the parser had read all ~50KB of it. Preloading starts the
    request immediately; `crossorigin` is required even for same-origin fonts,
    without which the browser fetches it a second time.
  -->
  <link
    rel="preload"
    as="font"
    type="font/woff2"
    href="/fonts/inter-latin-variable.woff2"
    crossorigin="anonymous"
  />

  <!--
    The hero avatar is the largest element in the initial viewport, so it is
    also the LCP candidate. Preloading the AVIF beats waiting for the parser to
    reach the <picture>; `imagesrcset` keeps the DPR ladder intact so a 2x
    screen doesn't download the 1x file and then the 2x one.
  -->
  <link
    rel="preload"
    as="image"
    type="image/avif"
    href="/profile-96.avif"
    imagesrcset="/profile-96.avif 1x, /profile-192.avif 2x, /profile-288.avif 3x"
    fetchpriority="high"
  />

  <!--
    The only {@html} on the site. `jsonLd` is built entirely from committed
    constants — there is no user input anywhere in the graph — and buildJsonLd()
    additionally escapes "<" so no value can close the script tag early. The
    `<\/script>` escape is required: without it the parser ends this component's
    script context at that literal.
  -->
  <!-- eslint-disable-next-line svelte/no-at-html-tags, no-useless-escape -->
  {@html `<script type="application/ld+json">${jsonLd}<\/script>`}
</svelte:head>

<a
  href="#main"
  class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[1000] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-gray-900 focus:shadow dark:focus:bg-gray-900 dark:focus:text-white"
>
  Skip to content
</a>

<ReadingProgress />
<Header />
{@render children()}
<Footer />
<Toaster />
<ThemeSwitch />
<ScrollToTop />
