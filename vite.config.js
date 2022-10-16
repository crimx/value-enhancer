/* eslint-env node */

import path from "path";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    build: {
      lib: {
        entry: path.resolve(__dirname, "src/index.ts"),
        formats: ["es", "cjs"],
      },
      outDir: "dist",
      sourcemap: isProd,
      minify: Boolean(process.env.MINIFY),
    },
    esbuild: {
      mangleProps: /[^_]_$/,
      mangleCache: require("./mangle-cache.json"),
    },
  };
});
