import { vi, describe, expect, it } from "vitest";
import { prisma } from "./fixtures";
import { NotFoundError } from "@/server/errors";
import {
  createDomainCategory,
  createDomainRequest,
  createDomainSector,
  createDomainService,
  createDomainUser,
} from "./domain-fixtures";

const authenticated = vi.hoisted(() => ({
  requireCurrentActor: vi.fn(),
}));

vi.mock("@/server/authorization", () => ({
  ...authenticated,
  assertRole: (
    actor: { role: string; isActive: boolean } | null,
    role: string,
  ) => {
    if (!actor?.isActive || actor.role !== role) {
      throw new Error("Unauthorized");
    }

    return actor;
  },
}));

import {
  getAttendantRequest,
  listAttendantQueue,
} from "@/modules/requests";

describe("attendant sector queue queries", () => {
  it("lists requests by the attendant's current sector snapshot, not current service configuration", async () => {
    const originalSector = await createDomainSector();
    const otherSector = await createDomainSector();
    const attendant = await createDomainUser({
      role: "ATTENDANT",
      sectorId: originalSector.id,
    });
    const requester = await createDomainUser({ role: "REQUESTER" });
    authenticated.requireCurrentActor.mockResolvedValue({
      id: attendant.id,
      role: attendant.role,
      sectorId: attendant.sectorId,
      isActive: attendant.isActive,
    });
    const category = await createDomainCategory();
    const service = await createDomainService({
      categoryId: category.id,
      sectorId: originalSector.id,
    });
    const originalSectorRequest = await createDomainRequest({
      requesterId: requester.id,
      serviceId: service.id,
      sectorId: originalSector.id,
    });
    const otherSectorRequest = await createDomainRequest({
      requesterId: requester.id,
      serviceId: service.id,
      sectorId: otherSector.id,
    });

    await prisma.service.update({
      where: { id: service.id },
      data: { sectorId: otherSector.id },
    });

    const queue = await listAttendantQueue(prisma);

    expect(queue.map(({ id }) => id)).toEqual([originalSectorRequest.id]);
    expect(queue[0]).toMatchObject({
      sectorId: originalSector.id,
      sectorNameSnapshot: originalSector.name,
      service: { id: service.id },
    });
    expect(queue.map(({ id }) => id)).not.toContain(otherSectorRequest.id);
  });

  it("hides another sector's request when addressed directly by ID", async () => {
    const ownSector = await createDomainSector();
    const otherSector = await createDomainSector();
    const attendant = await createDomainUser({
      role: "ATTENDANT",
      sectorId: ownSector.id,
    });
    const requester = await createDomainUser({ role: "REQUESTER" });
    authenticated.requireCurrentActor.mockResolvedValue({
      id: attendant.id,
      role: attendant.role,
      sectorId: attendant.sectorId,
      isActive: attendant.isActive,
    });
    const category = await createDomainCategory();
    const service = await createDomainService({
      categoryId: category.id,
      sectorId: otherSector.id,
    });
    const foreignRequest = await createDomainRequest({
      requesterId: requester.id,
      serviceId: service.id,
      sectorId: otherSector.id,
    });

    await expect(
      getAttendantRequest(foreignRequest.id, prisma),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      getAttendantRequest("00000000-0000-4000-8000-000000000020", prisma),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
