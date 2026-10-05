import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const testEnvironment = loadEnv("test", process.cwd(), "");

for (const key of ["DATABASE_URL", "TEST_DATABASE_URL"] as const) {
  if (process.env[key] === undefined && testEnvironment[key] !== undefined) {
    process.env[key] = testEnvironment[key];
  }
}

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    globalSetup: ["./tests/integration/global-setup.ts"],
    setupFiles: ["./tests/integration/setup.ts"],
    fileParallelism: false,
    maxWorkers: 1,
  },
});
