/* eslint-env node */

import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    build: {
      lib: {
        entry: path.resolve(__dirname, "src/value-enhancer.ts"),
        formats: ["es", "cjs"],
      },
      outDir: "dist",
      sourcemap: isProd,
      minify: false,
    },
  };
});
