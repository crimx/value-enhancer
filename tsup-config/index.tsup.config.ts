import { defineConfig } from "tsup";

const minify = Boolean(process.env.MINIFY);

console.log(process.env.NODE_ENV);

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["cjs", "esm"],
  splitting: false,
  sourcemap: false,
  clean: true,
  treeshake: true,
  dts: true,
  minify,
  define: minify ? { "process.env.NODE_ENV": '"production"' } : void 0,
  esbuildOptions: options => {
    options.mangleProps = /[^_]_$/;
    options.mangleCache = require("./mangle-cache.json");
  },
});
