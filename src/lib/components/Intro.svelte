<script lang="ts">
  import BsArrowRight from "$lib/icons/BsArrowRight.svelte";
  import BsLinkedin from "$lib/icons/BsLinkedin.svelte";
  import FaGithubSquare from "$lib/icons/FaGithubSquare.svelte";
  import HiDownload from "$lib/icons/HiDownload.svelte";
  import { siteConfig } from "$lib/seo";
</script>

<section
  id="home"
  tabindex="-1"
  aria-label="Introduction"
  data-section="Home"
  class="mb-28 max-w-200 scroll-mt-28 text-center outline-none sm:mb-0"
>
  <div class="flex items-center justify-center">
    <div class="relative">
      <div class="avatar-pop">
        <!--
          Hand-rolled responsive avatar in place of next/image. It is the only
          raster image on the site, always painted at 96 CSS px, so the whole
          job is three pre-generated DPR variants (see scripts/gen-images.mjs)
          offered newest-format-first. The Next version needed `imageSizes`/
          `deviceSizes` overrides in next.config.mjs precisely to stop it
          emitting a 14-entry srcset up to 3840w for this same 96px avatar.

          fetchpriority="high" is what `priority` expanded to; the preload is
          in +layout.svelte's <svelte:head>.
        -->
        <picture>
          <source
            type="image/avif"
            srcset="/profile-96.avif 1x, /profile-192.avif 2x, /profile-288.avif 3x"
          />
          <source
            type="image/webp"
            srcset="/profile-96.webp 1x, /profile-192.webp 2x, /profile-288.webp 3x"
          />
          <img
            src="/profile-96.jpg"
            srcset="/profile-96.jpg 1x, /profile-192.jpg 2x, /profile-288.jpg 3x"
            alt="{siteConfig.name} — {siteConfig.jobTitle}"
            width="96"
            height="96"
            fetchpriority="high"
            decoding="async"
            class="h-24 w-24 rounded-full border-[0.35rem] border-white object-cover shadow-xl"
          />
        </picture>
      </div>

      <span
        class="avatar-wave absolute right-0 bottom-0 text-4xl"
        aria-hidden="true">👋</span
      >
    </div>
  </div>

  {#if siteConfig.availability.open}
    <p
      class="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full border border-green-600/30 bg-green-100 px-3.5 py-1.5 text-sm font-medium text-green-800 dark:border-green-400/25 dark:bg-green-400/10 dark:text-green-300"
    >
      <span class="relative flex h-2 w-2" aria-hidden="true">
        <span
          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75 motion-reduce:animate-none"
        ></span>
        <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500"
        ></span>
      </span>
      {siteConfig.availability.label}
    </p>
  {/if}

  <h1 class="mt-4 mb-10 px-4 text-2xl leading-normal! font-medium sm:text-4xl">
    <span class="font-bold">Hello, I'm {siteConfig.shortName}.</span>
    I'm a <span class="font-bold">{siteConfig.jobTitle.toLowerCase()}</span>
    specializing in
    <span class="italic">
      AI automation &amp;
      <span class="whitespace-nowrap underline">cloud engineering.</span>
    </span>
  </h1>

  <div
    class="flex flex-col items-center justify-center gap-2 px-4 text-lg font-medium sm:flex-row"
  >
    <a
      href="#contact"
      class="focus-ring group flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-white outline-none transition hover:scale-110 hover:bg-gray-950 active:scale-105"
      data-track="cta_click"
      data-track-props={JSON.stringify({ cta: "get_in_touch" })}
    >
      Get in touch
      <BsArrowRight
        aria-hidden="true"
        class="opacity-70 transition group-hover:translate-x-1"
      />
    </a>

    <a
      aria-label="Download Manvendra Rajpoot's resume (PDF)"
      class="focus-ring borderBlack group flex cursor-pointer items-center gap-2 rounded-full bg-white px-7 py-3 outline-none transition hover:scale-110 active:scale-105 dark:bg-white/10"
      href="/resume"
      target="_blank"
      rel="noopener"
      download
      data-track="cv_download"
    >
      Download CV
      <HiDownload
        aria-hidden="true"
        class="opacity-60 transition group-hover:translate-y-1"
      />
    </a>

    <a
      aria-label="LinkedIn profile"
      class="focus-ring borderBlack flex cursor-pointer items-center gap-2 rounded-full bg-white p-4 text-gray-700 transition hover:scale-115 hover:text-gray-950 active:scale-105 dark:bg-white/10 dark:text-white/60"
      href="/linkedin"
      target="_blank"
      rel="noopener"
      data-track="social_click"
      data-track-props={JSON.stringify({ network: "linkedin" })}
    >
      <BsLinkedin aria-hidden="true" />
    </a>

    <a
      aria-label="GitHub profile"
      class="focus-ring borderBlack flex cursor-pointer items-center gap-2 rounded-full bg-white p-4 text-[1.35rem] text-gray-700 transition hover:scale-115 hover:text-gray-950 active:scale-105 dark:bg-white/10 dark:text-white/60"
      href="/github"
      target="_blank"
      rel="noopener"
      data-track="social_click"
      data-track-props={JSON.stringify({ network: "github" })}
    >
      <FaGithubSquare aria-hidden="true" />
    </a>
  </div>
</section>
