<script lang="ts">
  import SectionHeading from "./SectionHeading.svelte";
  import SectionSpy from "./SectionSpy.svelte";
</script>

<SectionSpy
  section="About"
  id="about"
  label="About Manvendra Rajpoot"
  animate
  class="mb-28 max-w-180 scroll-mt-28 text-center leading-8 outline-none sm:mb-40"
>
  <SectionHeading>About me</SectionHeading>

  <p class="mb-3">
    I'm a <span class="font-medium">backend developer</span> who enjoys building
    systems that are
    <span class="font-medium">scalable, secure, and quietly reliable</span>.
    Across my roles at <span class="font-medium">CloudTechTiq</span>
    and <span class="font-medium">Radixlink</span>, I've designed and shipped
    multi-tenant SaaS platforms, central authentication systems with
    multi-factor auth and role-based access, payment integrations across
    <span class="font-medium">Stripe, Razorpay and PayPal</span>, and
    <span class="font-medium">AI-powered features</span> — from automated
    invoice extraction to grammar correction in customer support. My core stack
    is
    <span class="font-medium">Python, Django, DRF and FastAPI</span>, backed by
    <span class="font-medium">PostgreSQL, Redis and MongoDB</span>, and shipped
    with
    <span class="font-medium">Docker, Kubernetes and CI/CD</span>.
    <span class="italic">My favorite part of the job</span> is the problem-solving
    — turning a messy, manual process into a clean, automated system that just works.
  </p>

  <p>
    I care most about the things users never notice:
    <span class="font-medium">API security</span>, real-time notifications,
    background-job systems, and disaster-recovery plans that keep data safe and
    services running. On the frontend I work with
    <span class="font-medium">React, Next.js and TypeScript</span>, so I can
    take a feature from the database all the way to the browser. I'm currently
    pursuing my
    <span class="font-medium">Master of Computer Applications</span> at Jain
    University after completing my BCA at Bundelkhand University, and I never
    stop <span class="underline">learning</span> — a new framework, a cloud
    service, or a better way to architect a backend. I'm open to
    <a
      href="#contact"
      class="font-medium underline underline-offset-2 hover:text-gray-950 dark:hover:text-white"
    >
      backend and full-stack roles
    </a>
    where I can build things that scale.
  </p>
</SectionSpy>
