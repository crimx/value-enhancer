export default {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverageFrom: ["src/**/*.ts", "!src/index.ts", "!src/dev/**/*"],
  coverageReporters: ["clover", "json", "lcov", "text"],
  moduleNameMapper: {
    "^value-enhancer$": "<rootDir>/src/index.ts",
  },
};
