/* eslint-env node */

module.exports = {
  version: "0.1",
  language: "en",
  words: ["coverallsapp", "typedoc", "vite", "vitest"],
  dictionaries: [
    "softwareTerms",
    "typescript",
    "node",
    "html",
    "css",
    "bash",
    "fonts",
    "filetypes",
    "npm",
    "en_US",
  ],
  ignorePaths: [
    "**/coverage/**",
    "**/node_modules/**",
    "**/dist/**",
    "cspell.config.js",
    "pnpm-lock.yaml",
    "CHANGELOG.md",
  ],
};
