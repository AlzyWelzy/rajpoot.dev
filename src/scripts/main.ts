// The site's single client entry point.
//
// Each of these modules used to be a `<script>` inside the .astro component
// it belonged to, which reads nicely but made Astro emit one entry chunk per
// component. That cost seven requests, and worse, it was a three-wave
// waterfall: the browser could not discover the shared `toast` and
// `active-section` store chunks until the component chunks that import them
// had themselves arrived, so those started ~760ms into the load. One entry
// with static imports gives Rollup a single chunk with nothing to discover.
//
// Every module below queries for its own elements and no-ops when they are
// absent, so loading them all on every page (including 404) is safe.
import "@/scripts/header";
import "@/scripts/theme-switch";
import "@/scripts/toast";
import "@/scripts/contact";
import "@/scripts/intro";
import "@/scripts/scroll-spy";
