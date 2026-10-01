import { PrismaClient } from "@prisma/client";

import { serverConfig } from "../config";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: serverConfig.databaseUrl || undefined,
    log: serverConfig.nodeEnv === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (serverConfig.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
