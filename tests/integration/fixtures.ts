import { PrismaClient } from "@prisma/client";
import { getIsolatedTestDatabaseUrl } from "./database-url";

export const prisma = new PrismaClient({
  datasourceUrl: getIsolatedTestDatabaseUrl(),
});

export async function resetTestFixtures(): Promise<void> {
  await prisma.$transaction([
    prisma.requestStatusEvent.deleteMany(),
    prisma.request.deleteMany(),
    prisma.service.deleteMany(),
    prisma.user.deleteMany(),
    prisma.category.deleteMany(),
    prisma.sector.deleteMany(),
  ]);
}
