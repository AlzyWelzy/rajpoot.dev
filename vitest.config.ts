import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure-logic unit tests run in Node; no DOM needed.
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
