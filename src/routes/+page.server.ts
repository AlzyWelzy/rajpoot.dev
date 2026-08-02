// `$env/dynamic/private`, not `$env/static/private`: the static form exports one
// named constant per variable and fails the build outright when the variable is
// absent, which would make an optional feature flag mandatory.
import { env } from "$env/dynamic/private";

import type { PageServerLoad } from "./$types";

/**
 * Testimonials are gated behind a build-time flag until there's a stronger set
 * of real endorsements. Hidden by default; set `SHOW_TESTIMONIALS=true` in the
 * build environment to render the section.
 *
 * This runs at prerender time, not per request — the page is static either way,
 * and the flag never reaches the browser.
 */
export const load: PageServerLoad = () => ({
  showTestimonials: env.SHOW_TESTIMONIALS === "true",
});
