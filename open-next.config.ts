import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache override: the site is fully statically prerendered
// (zero ISR/revalidate usage anywhere), so there is nothing for the R2-backed
// cache to store. Add one only if a route ever needs on-demand revalidation.
export default defineCloudflareConfig({});
