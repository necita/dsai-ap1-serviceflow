import { expect, it } from "vitest";
import { prisma, resetTestFixtures } from "./fixtures";

it("connects to the isolated PostgreSQL test database", async () => {
  await expect(prisma.$queryRaw`SELECT 1 AS result`).resolves.toEqual([{ result: 1 }]);
});

it("recreates fixtures without retaining test data", async () => {
  await prisma.sector.create({
    data: {
      name: "Integration fixture sector",
    },
  });

  await resetTestFixtures();

  await expect(prisma.sector.count()).resolves.toBe(0);
});
