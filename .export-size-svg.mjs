import { defineConfig } from "export-size-svg";

export default defineConfig({
  title: "value-enhancer",
  out: "./docs/images",
  exports: [
    {
      title: "*",
      code: "export * from './src/index.ts'",
    },
    {
      title: "{ readonlyVal, val } (core)",
      code: "export { val } from './src/index.ts'",
    },
    {
      title: "{ from }",
      code: "export { from } from './src/from.ts'",
      externals: ["./val", "./agent"],
    },
    {
      title: "{ derive }",
      code: "export { derive } from './src/derive.ts'",
      externals: ["./val", "./agent", "./from"],
    },
    {
      title: "{ combine }",
      code: "export { combine } from './src/combine.ts'",
      externals: ["./val", "./agent", "./from"],
    },
    {
      title: "{ compute }",
      code: "export { compute } from './src/compute.ts'",
      externals: ["./val", "./agent", "./from"],
    },
    {
      title: "{ flattenFrom }",
      code: "export { flattenFrom } from './src/flatten-from.ts'",
      externals: ["./val", "./agent", "./from"],
    },
    {
      title: "{ flatten }",
      code: "export { flatten } from './src/flatten.ts'",
      externals: ["./val", "./agent", "./flatten-from"],
    },
    {
      title: "{ reactiveMap }",
      code: "export { reactiveMap } from './src/collections/index.ts'",
      externals: ["value-enhancer"],
    },
    {
      title: "{ reactiveSet }",
      code: "export { reactiveSet } from './src/collections/index.ts'",
      externals: ["value-enhancer"],
    },
    {
      title: "{ reactiveList }",
      code: "export { reactiveList } from './src/collections/index.ts'",
      externals: ["value-enhancer"],
    },
  ],
});
