<script lang="ts">
  import { emailId, EMAIL_MAX_LENGTH, MESSAGE_MAX_LENGTH } from "$lib/data";
  import SectionHeading from "./SectionHeading.svelte";
  import SubmitBtn from "./SubmitBtn.svelte";
  import Turnstile from "./Turnstile.svelte";
</script>

<section
  id="contact"
  tabindex="-1"
  aria-label="Contact"
  data-section="Contact"
  data-reveal
  data-reveal-amount="0.1"
  class="mb-20 w-[min(100%,38rem)] scroll-mt-28 text-center outline-none sm:mb-28"
>
  <SectionHeading>Contact me</SectionHeading>

  <p class="-mt-6 text-gray-700 dark:text-white/80">
    Have a role, a project, or just want to say hi? Drop me a line below, or
    email me directly at
    <a class="underline" href="mailto:{emailId}">{emailId}</a>.
  </p>

  <!--
    A real form with a real action and method, not a JS-only widget.
    src/lib/enhance/contact.ts upgrades the submit to a fetch so the page
    doesn't navigate, and adds the toast, the inline error and the pending
    state. Without the script the browser still POSTs, the endpoint still
    validates and verifies, and the visitor gets a JSON response rather than
    silence — degraded, but not broken.
  -->
  <form
    data-contact-form
    method="post"
    action="/api/contact"
    class="mt-10 flex flex-col dark:text-black"
  >
    <!--
      Honeypot: hidden from real users; spam bots fill it and get silently
      dropped server-side. A non-semantic name + ignore hints keep browsers and
      password managers from autofilling it (which would wrongly drop a
      legitimate message). Kept alongside Turnstile because it costs nothing and
      catches the naive form-fillers before a challenge is ever evaluated.
    -->
    <input
      type="text"
      name="contact_reason_hp"
      tabindex="-1"
      autocomplete="off"
      aria-hidden="true"
      data-1p-ignore="true"
      data-lpignore="true"
      class="absolute left-[-9999px] h-0 w-0 overflow-hidden"
    />

    <label for="senderEmail" class="sr-only">Your email</label>
    <input
      id="senderEmail"
      name="senderEmail"
      type="email"
      required
      maxlength={EMAIL_MAX_LENGTH}
      autocomplete="email"
      placeholder="Your email"
      class="focus-ring borderBlack h-14 rounded-lg px-4 outline-none transition-all dark:bg-white/80 dark:focus:bg-white"
    />

    <label for="message" class="sr-only">Your message</label>
    <textarea
      id="message"
      name="message"
      required
      maxlength={MESSAGE_MAX_LENGTH}
      placeholder="Your message"
      class="focus-ring borderBlack my-3 h-52 resize-y rounded-lg p-4 outline-none transition-all dark:bg-white/80 dark:focus:bg-white"
    ></textarea>

    <Turnstile />

    <!--
      Directly in the form, not wrapped in a centering div.

      The form is `flex flex-col`, so a child with an explicit width (the button
      is `w-32`) sits at the start of the cross axis — i.e. left-aligned. That
      is how the original renders and a centred button reads as a different
      design. Verified against www.rajpoot.dev rather than assumed.
    -->
    <SubmitBtn />

    <p
      id="contact-error"
      data-contact-error
      hidden
      role="alert"
      class="mt-3 text-sm text-red-600 dark:text-red-400"
    ></p>
  </form>
</section>
