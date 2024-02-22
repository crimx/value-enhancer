import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    collections: "src/collections/index.ts",
  },
  format: ["cjs", "esm"],
  splitting: true,
  sourcemap: false,
  clean: true,
  treeshake: true,
  dts: true,
  minify: Boolean(process.env.MINIFY),
  esbuildOptions: options => {
    options.mangleProps = /[^_]_$/;
    options.mangleCache = require("./mangle-cache.json");
  },
});
