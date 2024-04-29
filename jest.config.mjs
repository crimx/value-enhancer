export default {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverageFrom: ["src/**/*.ts", "!src/index.ts"],
  coverageReporters: ["clover", "json", "lcov", "text"],
  moduleNameMapper: {
    "^value-enhancer$": "<rootDir>/src/index.ts",
  },
};
