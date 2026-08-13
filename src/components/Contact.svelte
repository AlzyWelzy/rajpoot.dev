<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import { toast } from "@/lib/stores/toast.svelte";
  import {
    emailId,
    EMAIL_MAX_LENGTH,
    MESSAGE_MAX_LENGTH,
    TURNSTILE_SITE_KEY,
    TURNSTILE_ACTION,
  } from "@/lib/data";

  declare global {
    interface Window {
      // Only the one call this component needs; the full Turnstile API
      // surface is much larger.
      turnstile?: { reset: (widgetIdOrContainer?: string) => void };
    }
  }

  // Controlled so a failed submit keeps what the user typed; cleared only on
  // success.
  let email = $state("");
  let message = $state("");
  let pending = $state(false);
  let error: string | null = $state(null);

  let formEl: HTMLFormElement | undefined;

  onMount(() => {
    if (!TURNSTILE_SITE_KEY) return;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!formEl) return;
    pending = true;
    error = null;

    const formData = new FormData(formEl);
    const { error: actionError } = await actions.submitContact(formData);

    // Turnstile tokens are single-use — reset so the next attempt (retry
    // after an error, or another message later) gets a fresh one. The
    // section stays mounted after both outcomes, unlike a page navigation
    // that would render a new widget for free.
    window.turnstile?.reset();
    pending = false;

    if (actionError) {
      error = actionError.message;
      toast.error(actionError.message);
      return;
    }

    toast.success("Email sent successfully!");
    email = "";
    message = "";
  }

  function onMessageKeydown(event: KeyboardEvent) {
    // Cmd/Ctrl+Enter submits; plain Enter stays a newline.
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      formEl
        ?.querySelector<HTMLButtonElement>('button[type="submit"]')
        ?.click();
    }
  }
</script>

<section
  id="contact"
  data-section-name="Contact"
  tabindex="-1"
  aria-label="Contact"
  class="fade-reveal mb-20 sm:mb-28 w-[min(100%,38rem)] text-center outline-none scroll-mt-28"
>
  <h2 class="text-3xl font-medium capitalize mb-8 text-center">Contact me</h2>

  <p class="text-gray-700 -mt-6 dark:text-white/80">
    Have a role, a project, or just want to say hi? Drop me a line below, or
    email me directly at <a class="underline" href={`mailto:${emailId}`}
      >{emailId}</a
    >.
  </p>

  <form
    bind:this={formEl}
    class="mt-10 flex flex-col dark:text-black"
    onsubmit={handleSubmit}
  >
    <!-- Honeypot: hidden from real users; spam bots fill it and get silently
         dropped server-side. A non-semantic name + ignore hints keep
         browsers/password managers from autofilling it (which would wrongly
         drop a legitimate message). -->
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
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? "contact-error" : undefined}
      class="h-14 px-4 rounded-lg borderBlack outline-none transition-all focus-ring dark:bg-white/80 dark:focus:bg-white"
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
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? "contact-error" : undefined}
      class="h-52 my-3 resize-y rounded-lg borderBlack p-4 outline-none transition-all focus-ring dark:bg-white/80 dark:focus:bg-white"
    ></textarea>
    {#if TURNSTILE_SITE_KEY}
      <div
        class="cf-turnstile self-center"
        data-sitekey={TURNSTILE_SITE_KEY}
        data-action={TURNSTILE_ACTION}
      ></div>
    {/if}

    <button
      type="submit"
      disabled={pending}
      aria-label={pending ? "Sending message…" : "Send message"}
      aria-busy={pending}
      class="group flex items-center justify-center gap-2 h-12 w-32 bg-gray-900 text-white rounded-full outline-none transition-all focus-ring hover:scale-110 hover:bg-gray-950 active:scale-105 dark:bg-white/10 disabled:scale-100 disabled:bg-gray-900/65 mx-auto"
    >
      {#if pending}
        <!-- aria-busy + aria-label already announce the state to AT; the
             visible "Sending" + spinner keep the button from looking
             emptied out. -->
        <span
          aria-hidden="true"
          class="h-4 w-4 animate-spin rounded-full border-b-2 border-white"
        ></span>
        Sending
      {:else}
        Send
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-3.5 w-3.5 opacity-70 transition-all group-hover:translate-x-1 group-hover:-translate-y-1"
        >
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      {/if}
    </button>

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
