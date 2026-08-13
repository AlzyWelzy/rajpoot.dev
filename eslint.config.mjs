import globals from "globals";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import svelte from "eslint-plugin-svelte";

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
  ...svelte.configs["flat/recommended"],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
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
