export function getIsolatedTestDatabaseUrl(): string {
  const value = process.env.TEST_DATABASE_URL;

  if (!value) {
    throw new Error(
      "PostgreSQL integration tests require TEST_DATABASE_URL. Configure a dedicated test database; DATABASE_URL is never used as a fallback.",
    );
  }

  let testUrl: URL;

  try {
    testUrl = new URL(value);
  } catch {
    throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  if (!["postgres:", "postgresql:"].includes(testUrl.protocol)) {
    throw new Error("TEST_DATABASE_URL must use the postgres:// or postgresql:// protocol.");
  }

  const testDatabase = decodeURIComponent(testUrl.pathname.replace(/^\/+/, ""));

  const developmentValue = process.env.DATABASE_URL;

  if (developmentValue) {
    let developmentUrl: URL;

    try {
      developmentUrl = new URL(developmentValue);
    } catch {
      throw new Error("DATABASE_URL must be valid before integration database isolation can be verified.");
    }

    const developmentDatabase = decodeURIComponent(
      developmentUrl.pathname.replace(/^\/+/, ""),
    );

    if (
      testUrl.hostname.toLowerCase() === developmentUrl.hostname.toLowerCase() &&
      testDatabase === developmentDatabase
    ) {
      throw new Error("TEST_DATABASE_URL points to the development database; refusing to run integration tests.");
    }
  }

  if (!testDatabase.toLowerCase().endsWith("_test")) {
    throw new Error("TEST_DATABASE_URL must target a dedicated database with a name ending in _test.");
  }

  return value;
}
