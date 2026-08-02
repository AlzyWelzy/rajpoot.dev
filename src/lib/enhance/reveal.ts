/**
 * One-shot fade-and-rise as an element scrolls into view — what motion's
 * `whileInView` + `viewport={{ once: true }}` used to do.
 *
 * Elements are authored **visible** and this hides them only after confirming
 * it can un-hide them: the script is running, `IntersectionObserver` exists,
 * and the visitor hasn't asked for reduced motion. That ordering is the whole
 * point. The React version declared `initial={{ opacity: 0 }}` in the markup,
 * so any failure to hydrate left the section permanently invisible; here every
 * failure mode — no JS, old browser, reduced motion — degrades to plain visible
 * content. There is an e2e spec asserting exactly that.
 */
export function initReveal() {
  const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (!targets.length) return;

  if (
    typeof IntersectionObserver === "undefined" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  for (const node of targets) {
    node.classList.add("reveal-pending");

    const delay = Number(node.dataset.revealDelay ?? 0);
    if (delay) node.style.transitionDelay = `${delay}s`;

    const amount = Number(node.dataset.revealAmount ?? 0.2);
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
  }
}

/**
 * Floating button that appears once the visitor has scrolled past roughly one
 * viewport and smooth-scrolls back to the top — worth having on a page this
 * long. Rendered in the markup and hidden with `hidden` until needed, so it
 * simply never appears when the script doesn't run.
 */
export function initScrollToTop() {
  const button = document.querySelector<HTMLElement>("[data-scroll-top]");
  if (!button) return;

  const sync = () => {
    button.hidden = scrollY <= innerHeight;
  };

  button.addEventListener("click", () => {
    scrollTo({ top: 0, behavior: "smooth" });
  });

  addEventListener("scroll", sync, { passive: true });
  sync();
}
