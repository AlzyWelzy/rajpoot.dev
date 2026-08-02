export type RevealOptions = {
  /** Fraction of the element that must be visible before it reveals. */
  amount?: number;
  /** Seconds of delay before the transition starts. */
  delay?: number;
  /** Set false to leave the element alone (Svelte has no conditional
   *  `use:`, and a no-op is cheaper than branching the markup). */
  enabled?: boolean;
};

/**
 * One-shot fade-and-rise as an element scrolls into view — the replacement for
 * motion's `whileInView` + `viewport={{ once: true }}`.
 *
 * The element is authored **visible** and this action hides it only after
 * confirming it can un-hide it: JS is running, `IntersectionObserver` exists,
 * and the visitor hasn't asked for reduced motion. That ordering matters. The
 * motion version declared `initial={{ opacity: 0 }}` in the markup, so any
 * failure to hydrate left the section permanently invisible; here every failure
 * mode degrades to plain visible content, which is what the reduced-motion e2e
 * spec asserts.
 */
export function reveal(node: HTMLElement, options: RevealOptions = {}) {
  const { amount = 0.2, delay = 0, enabled = true } = options;

  if (
    !enabled ||
    typeof IntersectionObserver === "undefined" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return {};
  }

  node.classList.add("reveal-pending");
  node.style.transitionDelay = `${delay}s`;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        node.classList.remove("reveal-pending");
        observer.disconnect();
      }
    },
    { threshold: amount },
  );

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    },
  };
}
