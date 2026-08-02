<script lang="ts">
  import { track } from "$lib/analytics";
  import { reveal } from "$lib/actions/reveal";
  import { sectionSpy } from "$lib/actions/section-spy";
  import { emailId, EMAIL_MAX_LENGTH, MESSAGE_MAX_LENGTH } from "$lib/data";
  import { toast } from "$lib/state/toast.svelte";
  import type { SendEmailResult } from "$lib/types";
  import SectionHeading from "./SectionHeading.svelte";
  import SubmitBtn from "./SubmitBtn.svelte";
  import Turnstile from "./Turnstile.svelte";

  let email = $state("");
  let message = $state("");
  let pending = $state(false);
  let error = $state<string | null>(null);
  let turnstileToken = $state<string | null>(null);

  let turnstile = $state<ReturnType<typeof Turnstile> | null>(null);
  let form = $state<HTMLFormElement | null>(null);

  /** Boot Turnstile on first contact with the form, not on page load. */
  function warmUpChallenge() {
    turnstile?.start();
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (pending || !form) return;

    pending = true;
    error = null;

    try {
      const body = new FormData(form);
      if (turnstileToken) body.set("cf-turnstile-response", turnstileToken);

      const response = await fetch("/api/contact", {
        method: "POST",
        body,
      });
      const result = (await response.json()) as SendEmailResult;

      if (result.error) {
        error = result.error;
        toast.error(result.error);
        return;
      }

      toast.success("Email sent successfully!");
      track("contact_submit");
      // Cleared only on success, so a failed submit keeps what was typed.
      email = "";
      message = "";
    } catch {
      const failure = "Couldn't send your message. Please try again later.";
      error = failure;
      toast.error(failure);
    } finally {
      pending = false;
    }
  }

  function onMessageKeydown(event: KeyboardEvent) {
    // Cmd/Ctrl+Enter submits; plain Enter stays a newline.
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      form?.requestSubmit();
    }
  }
</script>

<section
  id="contact"
  tabindex="-1"
  aria-label="Contact"
  data-reveal
  use:sectionSpy={"Contact"}
  use:reveal={{ amount: 0.1 }}
  class="mb-20 w-[min(100%,38rem)] scroll-mt-28 text-center outline-none sm:mb-28"
>
  <SectionHeading>Contact me</SectionHeading>

  <p class="-mt-6 text-gray-700 dark:text-white/80">
    Have a role, a project, or just want to say hi? Drop me a line below, or
    email me directly at
    <a class="underline" href="mailto:{emailId}">{emailId}</a>.
  </p>

  <form
    bind:this={form}
    onsubmit={handleSubmit}
    onfocusin={warmUpChallenge}
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
      bind:value={email}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error ? "contact-error" : undefined}
      class="focus-ring borderBlack h-14 rounded-lg px-4 outline-none transition-all dark:bg-white/80 dark:focus:bg-white"
    />

    <label for="message" class="sr-only">Your message</label>
    <textarea
      id="message"
      name="message"
      required
      maxlength={MESSAGE_MAX_LENGTH}
      placeholder="Your message"
      bind:value={message}
      onkeydown={onMessageKeydown}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error ? "contact-error" : undefined}
      class="focus-ring borderBlack my-3 h-52 resize-y rounded-lg p-4 outline-none transition-all dark:bg-white/80 dark:focus:bg-white"
    ></textarea>

    <Turnstile bind:this={turnstile} onToken={(t) => (turnstileToken = t)} />

    <div class="mt-3 flex justify-center">
      <SubmitBtn {pending} />
    </div>

    {#if error}
      <p
        id="contact-error"
        role="alert"
        class="mt-3 text-sm text-red-600 dark:text-red-400"
      >
        {error}
      </p>
    {/if}
  </form>
</section>
