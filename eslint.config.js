import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", args: "none" }],
      "no-empty": "off",
    },
  },
];