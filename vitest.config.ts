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
      // Floors slightly below current coverage (≈78/73/72/79) so regressions
      // fail CI; ratchet upward as coverage grows.
      thresholds: {
        statements: 75,
        branches: 70,
        functions: 70,
        lines: 75,
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
