import { gzipSizeFromFileSync } from "gzip-size";
import prettyBytes from "pretty-bytes";
import { gray, green } from "yoctocolors";

console.log();
console.log(
  `${gray("gzip")} dist/index.mjs ${green(
    prettyBytes(gzipSizeFromFileSync("dist/index.mjs"))
  )}`
);
console.log(
  `${gray("gzip")} dist/index.js  ${green(
    prettyBytes(gzipSizeFromFileSync("dist/index.js"))
  )}`
);
console.log(
  `${gray("gzip")} dist/collections.mjs ${green(
    prettyBytes(gzipSizeFromFileSync("dist/collections.mjs"))
  )}`
);
console.log(
  `${gray("gzip")} dist/collections.js  ${green(
    prettyBytes(gzipSizeFromFileSync("dist/collections.js"))
  )}`
);
