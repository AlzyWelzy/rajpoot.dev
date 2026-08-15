import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Mirror the tsconfig "@/*" path alias so tests can import like the app.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      // v4 reports every included source file by default (not only imported
      // ones), so the numbers match what CI computes and nothing hides at 0%.
      //
      // Deliberately scoped to logic-bearing modules only. The interactive
      // components (Header, Contact, Toast) are now plain <script> blocks in
      // .astro files — UI/wiring, not logic — so Playwright's
      // contact-form E2E test is the real safety net for those (a unit test
      // that mounts a component once and asserts nothing was the exact
      // anti-pattern this threshold used to encourage; see below).
      include: [
        "src/email/**/*.ts",
        "src/lib/**/*.ts",
        "src/lib/stores/**/*.ts",
      ],
      exclude: [
        "**/*.test.*",
        "**/*.d.ts",
        // Type-only module: its runtime footprint is a single re-export used
        // solely in type positions, so there is nothing to execute.
        "src/lib/types.ts",
        "src/lib/generated/**",
        "src/lib/icons.ts",
        "src/test-utils/**",
      ],
      // A floor, not a target. At 100% the thresholds started writing the
      // tests: whole spec files existed only to render a component once and
      // assert nothing, and source carried `/* v8 ignore */` pragmas to hide
      // defensive branches that are correct precisely because they are hard to
      // reach. 90% keeps a real regression gate while letting the suite be
      // judged on whether it describes behaviour.
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          // Pure-logic unit tests run in Node; no DOM needed.
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["node_modules/**", "e2e/**", "**/*.dom.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          // Stores/DOM helpers that touch window/document need a DOM.
          name: "dom",
          environment: "jsdom",
          include: ["src/**/*.dom.test.ts"],
          exclude: ["node_modules/**", "e2e/**"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
