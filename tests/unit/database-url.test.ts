import { afterEach, describe, expect, it, vi } from "vitest";
import { getIsolatedTestDatabaseUrl } from "../integration/database-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isolated integration database URL", () => {
  it("does not fall back to the development database", () => {
    vi.stubEnv("TEST_DATABASE_URL", "");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/serviceflow_dev");

    expect(() => getIsolatedTestDatabaseUrl()).toThrow("TEST_DATABASE_URL");
  });

  it("rejects the development database", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/serviceflow_dev");
    vi.stubEnv("TEST_DATABASE_URL", "postgresql://localhost/serviceflow_dev");

    expect(() => getIsolatedTestDatabaseUrl()).toThrow("development database");
  });

  it("requires a dedicated database name ending in _test", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/serviceflow_dev");
    vi.stubEnv("TEST_DATABASE_URL", "postgresql://localhost/postgres");

    expect(() => getIsolatedTestDatabaseUrl()).toThrow("ending in _test");
  });

  it("accepts a separate database with the test suffix", () => {
    const testDatabaseUrl = "postgresql://localhost/serviceflow_test";
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/serviceflow_dev");
    vi.stubEnv("TEST_DATABASE_URL", testDatabaseUrl);

    expect(getIsolatedTestDatabaseUrl()).toBe(testDatabaseUrl);
  });
});
