import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import ts from "typescript-eslint";

import svelteConfig from "./svelte.config.js";

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: [".svelte"],
        parser: ts.parser,
        svelteConfig,
      },
    },
  },
  {
    rules: {
      // `resolve()` exists to keep links valid under a configured `base` path
      // and across route renames. This site has neither: every href is a hash
      // anchor into the one page, an absolute external URL, or a fixed path
      // (/resume, /github) that is also printed on a CV and cannot move. The
      // rule would have us wrap all of them for no benefit.
      "svelte/no-navigation-without-resolve": ["error", { ignoreLinks: true }],

      // A leading underscore marks a parameter that exists only to hold a
      // position — a mock that must accept an argument so the call is
      // inspectable, a callback whose first arg it ignores.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    ignores: [
      ".svelte-kit/",
      // wrangler's dev/bundle scratch space, which contains the *bundled*
      // worker — tens of thousands of lines of third-party output that
      // otherwise drown every real finding.
      ".wrangler/",
      "build/",
      "coverage/",
      "dist/",
      "node_modules/",
      "playwright-report/",
      "test-results/",
      "static/",
      "_headers",
    ],
  },
);
