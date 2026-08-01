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
      // v4 reports every included source file by default (not only imported
      // ones), so the numbers match what CI computes and nothing hides at 0%.
      include: [
        "actions/**/*.{ts,tsx}",
        "app/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "context/**/*.{ts,tsx}",
        "email/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.test.*",
        "**/*.d.ts",
        // Type-only module: its runtime footprint is a single re-export used
        // solely in type positions, so there is nothing to execute.
        "lib/types.ts",
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
