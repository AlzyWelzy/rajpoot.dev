import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
// `vitest/config` rather than `vite`: it is the same defineConfig widened to
// accept the `test` key. Importing from "vite" typechecks the file as a plain
// Vite config and rejects it.
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],

  // src/lib/enhance/ is bundled by esbuild (scripts/gen-enhance.mjs), which
  // supplies this via its own `define`. Vitest imports those modules directly,
  // so it needs the same constant or analytics.ts throws on a bare reference.
  // The app build never imports that module, so this is inert there.
  define: {
    __ANALYTICS_ENDPOINT__: JSON.stringify(
      process.env.PUBLIC_ANALYTICS_ENDPOINT ?? "",
    ),
  },

  // No `build` block: SvelteKit owns cssCodeSplit, and the CSS inlining that
  // matters for first paint is `kit.inlineStyleThreshold` in svelte.config.js.

  test: {
    projects: [
      {
        // Component tests: real DOM, Svelte compiled for the browser.
        extends: true,
        test: {
          name: "client",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          include: ["src/**/*.svelte.test.ts"],
          globals: true,
        },
      },
      {
        // Everything else — pure logic, header generation, endpoint helpers.
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.svelte.test.ts"],
          globals: true,
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/**/*.{ts,js}",
        "src/routes/**/*.ts",
        "src/hooks.server.ts",
      ],
      exclude: [
        "src/lib/generated/**",
        // Generated verbatim from react-icons; there is no logic to cover.
        "src/lib/icons/**",
        // Four-line delegations to servePdf / a feature flag. A unit test here
        // would assert that the file passes its own arguments through; what
        // actually matters — the headers, the bytes, the 404 — is covered by
        // src/lib/serve-pdf.test.ts and e2e/documents.spec.ts.
        "src/routes/resume/**",
        "src/routes/cover_letter/**",
        "src/routes/experience_letter/**",
        "src/routes/+page.server.ts",
        "src/**/*.test.ts",
        "src/**/*.d.ts",
      ],
      thresholds: {
        // Set just under actual (95/88/98/95) so a real regression trips them
        // but ordinary churn doesn't. Not 100 — see AGENTS.md. Tests exist to
        // describe behaviour, not to move a number.
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
