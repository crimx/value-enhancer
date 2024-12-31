import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**"],
      reporter: ["html", "text", "lcov"],
    },
    poolOptions: {
      forks: {
        execArgv: ["--expose-gc"],
      },
    },
  },
});
