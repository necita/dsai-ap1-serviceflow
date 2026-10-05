import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { getIsolatedTestDatabaseUrl } from "./database-url";

export default async function globalSetup(): Promise<void> {
  const testDatabaseUrl = getIsolatedTestDatabaseUrl();
  const prisma = new PrismaClient({ datasourceUrl: testDatabaseUrl });

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    throw new Error(
      "PostgreSQL integration setup could not connect to TEST_DATABASE_URL. Verify the dedicated test database exists and the URL is correct; credentials are not included in this error.",
    );
  } finally {
    await prisma.$disconnect();
  }

  const prismaCli = resolve(process.cwd(), "node_modules", "prisma", "build", "index.js");
  const migration = spawnSync(
    process.execPath,
    [prismaCli, "migrate", "deploy", "--schema", resolve(process.cwd(), "prisma", "schema.prisma")],
    {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
      encoding: "utf8",
    },
  );

  if (migration.stdout) {
    process.stdout.write(migration.stdout);
  }

  if (migration.stderr) {
    process.stderr.write(migration.stderr);
  }

  if (migration.error) {
    throw new Error(`PostgreSQL integration setup could not start Prisma migrations: ${migration.error.message}`);
  }

  if (migration.status !== 0) {
    throw new Error(
      `PostgreSQL integration setup failed while applying migrations (exit code ${migration.status ?? "unknown"}).`,
    );
  }
}
