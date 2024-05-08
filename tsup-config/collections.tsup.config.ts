import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    collections: "src/collections/index.ts",
  },
  format: ["cjs", "esm"],
  splitting: false,
  sourcemap: false,
  clean: false,
  treeshake: true,
  dts: true,
  minify: Boolean(process.env.MINIFY),
  esbuildOptions: options => {
    options.mangleProps = /[^_]_$/;
    options.mangleCache = require("./mangle-cache.json");
  },
  esbuildPlugins: [
    {
      name: "replace-imports",
      setup(build) {
        build.onResolve({ filter: /^value-enhancer$/ }, () => {
          return {
            path:
              build.initialOptions.define?.TSUP_FORMAT === '"cjs"'
                ? "."
                : "./index.mjs",
            external: true,
          };
        });
      },
    },
  ],
});
