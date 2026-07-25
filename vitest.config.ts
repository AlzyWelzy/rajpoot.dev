import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Mirror the tsconfig "@/*" path alias so tests can import like the app.
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      include: [
        "actions/**",
        "app/**",
        "components/**",
        "context/**",
        "email/**",
        "lib/**",
      ],
      exclude: ["**/*.test.*", "**/*.d.ts"],
      // Floors kept ~2 points below current coverage (≈87/80/85/88) so genuine
      // regressions fail CI without a razor-thin margin that trips on trivial
      // churn. Ratchet upward as coverage grows.
      thresholds: {
        statements: 85,
        branches: 78,
        functions: 83,
        lines: 86,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          // Pure-logic unit tests run in Node; no DOM needed.
          name: "unit",
          environment: "node",
          include: ["**/*.test.ts"],
          exclude: ["node_modules/**", ".next/**", "e2e/**", "**/*.spec.ts"],
        },
      },
      {
        extends: true,
        test: {
          // Component/context tests need a DOM.
          name: "component",
          environment: "jsdom",
          include: ["**/*.test.tsx"],
          exclude: ["node_modules/**", ".next/**", "e2e/**"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
