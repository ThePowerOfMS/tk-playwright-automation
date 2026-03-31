// eslint.config.mjs
import js from "@eslint/js";
import ts from "typescript-eslint";
import playwright from "eslint-plugin-playwright";

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      playwright,
    },
    rules: {
      "no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
    env: {
      browser: true,
      node: true,
      "playwright/playwright-test": true,
    },
  },
];
