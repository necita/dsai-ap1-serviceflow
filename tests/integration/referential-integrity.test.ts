import { describe, expect, it } from "vitest";
import { prisma } from "./fixtures";
import {
  createDomainCategory,
  createDomainRequest,
  createDomainSector,
  createDomainService,
  createDomainUser,
} from "./domain-fixtures";

describe("historical reference integrity", () => {
  it("prevents physical deletion of configuration, users, and requests referenced by history", async () => {
    const requester = await createDomainUser({ role: "REQUESTER" });
    const attendantSector = await createDomainSector();
    const attendant = await createDomainUser({
      role: "ATTENDANT",
      sectorId: attendantSector.id,
    });
    const category = await createDomainCategory();
    const sector = await createDomainSector();
    const service = await createDomainService({
      categoryId: category.id,
      sectorId: sector.id,
    });
    const request = await createDomainRequest({
      requesterId: requester.id,
      serviceId: service.id,
      sectorId: sector.id,
    });
    const event = await prisma.requestStatusEvent.create({
      data: {
        requestId: request.id,
        actorId: attendant.id,
        fromStatus: "OPEN",
        toStatus: "IN_PROGRESS",
      },
    });

    await expect(
      prisma.request.delete({ where: { id: request.id } }),
    ).rejects.toMatchObject({ code: "P2003" });
    await expect(
      prisma.user.delete({ where: { id: requester.id } }),
    ).rejects.toMatchObject({ code: "P2003" });
    await expect(
      prisma.user.delete({ where: { id: attendant.id } }),
    ).rejects.toMatchObject({ code: "P2003" });
    await expect(
      prisma.service.delete({ where: { id: service.id } }),
    ).rejects.toMatchObject({ code: "P2003" });
    await expect(
      prisma.category.delete({ where: { id: category.id } }),
    ).rejects.toMatchObject({ code: "P2003" });
    await expect(
      prisma.sector.delete({ where: { id: sector.id } }),
    ).rejects.toMatchObject({ code: "P2003" });

    await expect(
      prisma.requestStatusEvent.findUniqueOrThrow({ where: { id: event.id } }),
    ).resolves.toMatchObject({
      requestId: request.id,
      actorId: attendant.id,
      fromStatus: "OPEN",
      toStatus: "IN_PROGRESS",
    });
  });

  it("rejects relations to nonexistent records at the PostgreSQL boundary", async () => {
    await expect(
      prisma.service.create({
        data: {
          name: "Invalid category reference",
          description: "The referenced category does not exist",
          categoryId: "00000000-0000-4000-8000-000000009991",
          sectorId: "00000000-0000-4000-8000-000000009992",
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });
  });
});
