import replace from "@rollup/plugin-replace";
import fs from "node:fs";
import prettyBytes from "pretty-bytes";
import { rollup } from "rollup";
import { bold, green } from "yoctocolors";

fs.writeFileSync(
  "dist/temp.mjs",
  `export * from './index.mjs'; export * from './collections.mjs';`
);

const bundle = await rollup({
  input: "dist/temp.mjs",
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        "process.env.NODE_ENV": '"production"',
      },
    }),
  ],
});

const { output } = await bundle.write({
  format: "umd",
  file: "dist/index.umd.js",
  name: "ValueEnhancer",
});

fs.rmSync("dist/temp.mjs");

console.log(
  green("UMD"),
  bold("dist/index.umd.js"),
  green(prettyBytes(output[0].code.length))
);
