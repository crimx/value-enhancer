import fs from "node:fs";
import prettyBytes from "pretty-bytes";
import { rollup } from "rollup";
import { bold, green } from "yoctocolors";

fs.writeFileSync(
  "dist/dummy.mjs",
  `export * from './index.mjs'; export * from './collections.mjs';`
);

const bundle = await rollup({
  input: "dist/dummy.mjs",
});

const { output } = await bundle.write({
  format: "umd",
  file: "dist/index.umd.js",
  name: "valueEnhancer",
});

fs.rmSync("dist/dummy.mjs");

console.log(
  green("UMD"),
  bold("dist/index.umd.js"),
  green(prettyBytes(output[0].code.length))
);
