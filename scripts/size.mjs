/* global process */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";
import prettyBytes from "pretty-bytes";
import { bold, cyan, dim, green } from "yoctocolors";

main();

async function main() {
  const __dirname = fileURLToPath(new URL(".", import.meta.url));

  const result = spawnSync("./node_modules/.bin/size-limit", ["--json"], {
    cwd: join(__dirname, ".."),
  });

  const sizes = JSON.parse(result.output.join("\n"));

  const readmePath = join(__dirname, "..", "README.md");

  const readmeOrigin = readFileSync(readmePath, "utf8");

  const readme = readmeOrigin.replace(
    /<!-- size-section-start -->([\s\S]*?)<!-- size-section-end -->\n/,
    await formatMarkdown(
      `<!-- size-section-start -->\n\n` +
        genSizes(sizes) +
        `\n\n<!-- size-section-end -->\n`,
      readmePath
    )
  );

  if (process.env.CI) {
    if (readmeOrigin !== readme) {
      console.error(
        `The README.md file is not up to date. Please run the following command:`
      );
      console.error(`\n  node scripts/size.mjs\n`);
      process.exit(1);
    } else {
      process.exit(0);
    }
  }

  writeFileSync(readmePath, readme, "utf8");

  printResult(sizes);
}

async function formatMarkdown(source, path) {
  return prettier.format(source, {
    ...(await prettier.resolveConfig(path)),
    parser: "markdown",
  });
}

function genSizes(sizes) {
  return (
    `| import | size(brotli) |\n` +
    `| ------ | ------------ |\n` +
    sizes
      .map(({ name, size }) => `| ${name} | ${prettyBytes(size)} |`)
      .join("\n")
  );
}

function printResult(sizes) {
  sizes = sizes.map(({ name, size }) => ({
    name: name.replace(/^`(.*)`$/, (_, p1) => p1),
    size: prettyBytes(size),
  }));
  const maxNameLength = Math.max(...sizes.map(({ name }) => name.length));

  console.log();
  for (const { name, size } of sizes) {
    console.log(
      `${cyan("SIZE")} ${bold(name)}${dim(
        Array(maxNameLength - name.length + 2)
          .fill("·")
          .join("")
      )} ${green(size)}`
    );
  }
}
