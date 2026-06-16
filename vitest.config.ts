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
    // Pure-logic unit tests run in Node; no DOM needed.
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", "e2e/**", "**/*.spec.ts"],
  },
});
