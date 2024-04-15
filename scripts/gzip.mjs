import { readdirSync, readFileSync } from "fs";
import { gzipSizeFromFileSync, gzipSizeSync } from "gzip-size";
import { dirname, join } from "path";
import prettyBytes from "pretty-bytes";
import { fileURLToPath } from "url";
import { gray, green } from "yoctocolors";

const __dirname = dirname(fileURLToPath(import.meta.url));

const files = readdirSync(join(__dirname, "../dist"));

const mjsChunks = files.filter(file => /^chunk-.+\.mjs$/.test(file));
const mjsIndex = ["index.mjs", ...mjsChunks]
  .map(file => readFileSync(join(__dirname, "../dist", file), "utf8"))
  .join("\n");

const jsChunks = files.filter(file => /^chunk-.+\.js$/.test(file));
const jsIndex = ["index.js", ...jsChunks]
  .map(file => readFileSync(join(__dirname, "../dist", file), "utf8"))
  .join("\n");

console.log();
console.log(
  `${gray("gzip")} dist/index(all) ${green(
    prettyBytes(gzipSizeSync(mjsIndex))
  )}`
);
console.log(
  `${gray("gzip")} dist/index(all) ${green(prettyBytes(gzipSizeSync(jsIndex)))}`
);
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
console.log();
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
