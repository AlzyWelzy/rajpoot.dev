import globals from "globals";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      ".astro/**",
      "node_modules/**",
      "public/**",
      "e2e/**",
      "scripts/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      ".wrangler/**",
      "worker-configuration.d.ts",
    ],
  },
  ...tseslint.configs.recommended,
  ...astro.configs["flat/recommended"],
  ...astro.configs["flat/jsx-a11y-recommended"],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    rules: {
      // Astro Actions' handler signature intentionally leaves some
      // parameters unused (e.g. context) depending on the action.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
);
