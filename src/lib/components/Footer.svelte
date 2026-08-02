<script lang="ts">
  import BsEnvelope from "$lib/icons/BsEnvelope.svelte";
  import BsFacebook from "$lib/icons/BsFacebook.svelte";
  import BsGithub from "$lib/icons/BsGithub.svelte";
  import BsInstagram from "$lib/icons/BsInstagram.svelte";
  import BsLinkedin from "$lib/icons/BsLinkedin.svelte";
  import BsRssFill from "$lib/icons/BsRssFill.svelte";
  import BsTwitterX from "$lib/icons/BsTwitterX.svelte";
  import { siteConfig } from "$lib/seo";

  // Social entries point at the internal redirect routes (src/lib/redirects.ts),
  // so the destination URLs stay defined in one place.
  const socialLinks = [
    { label: "GitHub", href: "/github", Icon: BsGithub },
    { label: "LinkedIn", href: "/linkedin", Icon: BsLinkedin },
    { label: "X (Twitter)", href: "/twitter", Icon: BsTwitterX },
    { label: "Instagram", href: "/instagram", Icon: BsInstagram },
    { label: "Facebook", href: "/facebook", Icon: BsFacebook },
    { label: "Blog", href: siteConfig.blog, Icon: BsRssFill },
  ];

  const iconLinkClasses =
    "focus-ring flex min-h-11 min-w-11 items-center justify-center rounded-full transition hover:scale-115 hover:text-gray-950 active:scale-105 dark:hover:text-white";

  const currentYear = new Date().getFullYear();
</script>

<!-- No role="contentinfo": a top-level <footer> already exposes that landmark. -->
<footer class="px-4 pb-10 text-center text-gray-600 dark:text-white/70">
  <p class="mb-2 block text-xs">
    <span class="font-semibold">
      Building scalable, secure backends and AI-powered systems.
    </span>
    Thanks for stopping by.
  </p>

  <nav
    aria-label="Social links"
    class="mb-3 flex flex-wrap items-center justify-center gap-1 text-lg"
  >
    {#each socialLinks as { label, href, Icon } (label)}
      <a
        aria-label={label}
        title={label}
        {href}
        target="_blank"
        rel="noopener noreferrer"
        class={iconLinkClasses}
      >
        <Icon aria-hidden="true" />
      </a>
    {/each}
    <a
      aria-label="Email"
      title="Email"
      href="mailto:{siteConfig.email}"
      class={iconLinkClasses}
    >
      <BsEnvelope aria-hidden="true" />
    </a>
  </nav>

  <small class="text-xs">
    &copy; {currentYear}
    {siteConfig.name}. All rights reserved.
  </small>
</footer>
