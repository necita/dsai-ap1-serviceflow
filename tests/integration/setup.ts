import { afterAll, beforeEach } from "vitest";
import { prisma, resetTestFixtures } from "./fixtures";

beforeEach(async () => {
  await resetTestFixtures();
});

afterAll(async () => {
  await prisma.$disconnect();
});
