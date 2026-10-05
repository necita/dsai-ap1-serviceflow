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
    actor: { id: string; role: string; isActive: boolean } | null,
    role: string,
  ) => {
    if (!actor?.isActive || actor.role !== role) {
      throw new Error("Unauthorized");
    }

    return actor;
  },
}));

import {
  getRequesterRequest,
  listRequesterRequests,
} from "@/modules/requests";

describe("requester request queries", () => {
  it("lists only the current requester's requests with snapshots and chronological history", async () => {
    const requester = await createDomainUser({ role: "REQUESTER" });
    const otherRequester = await createDomainUser({ role: "REQUESTER" });
    const sector = await createDomainSector();
    const attendant = await createDomainUser({
      role: "ATTENDANT",
      sectorId: sector.id,
    });
    authenticated.requireCurrentActor.mockResolvedValue(requester);
    const category = await createDomainCategory();
    const service = await createDomainService({
      categoryId: category.id,
      sectorId: sector.id,
    });
    const ownRequest = await createDomainRequest({
      requesterId: requester.id,
      serviceId: service.id,
      sectorId: sector.id,
    });
    await createDomainRequest({
      requesterId: otherRequester.id,
      serviceId: service.id,
      sectorId: sector.id,
    });

    await prisma.requestStatusEvent.createMany({
      data: [
        {
          requestId: ownRequest.id,
          actorId: requester.id,
          fromStatus: null,
          toStatus: "OPEN",
          occurredAt: new Date("2026-10-05T10:00:00.000Z"),
        },
        {
          requestId: ownRequest.id,
          actorId: attendant.id,
          fromStatus: "OPEN",
          toStatus: "IN_PROGRESS",
          occurredAt: new Date("2026-10-05T11:00:00.000Z"),
        },
      ],
    });

    const results = await listRequesterRequests(prisma);

    expect(results.map(({ id }) => id)).toEqual([ownRequest.id]);
    expect(results[0]).toMatchObject({
      serviceNameSnapshot: service.name,
      serviceDescriptionSnapshot: service.description,
      categoryNameSnapshot: category.name,
      sectorNameSnapshot: sector.name,
      events: [
        { fromStatus: null, toStatus: "OPEN", actor: { id: requester.id } },
        {
          fromStatus: "OPEN",
          toStatus: "IN_PROGRESS",
          actor: { id: attendant.id },
        },
      ],
    });
  });

  it("returns a request by direct ID only to its requester and hides foreign or missing IDs", async () => {
    const requester = await createDomainUser({ role: "REQUESTER" });
    const otherRequester = await createDomainUser({ role: "REQUESTER" });
    authenticated.requireCurrentActor.mockResolvedValue(requester);
    const category = await createDomainCategory();
    const sector = await createDomainSector();
    const service = await createDomainService({
      categoryId: category.id,
      sectorId: sector.id,
    });
    const ownRequest = await createDomainRequest({
      requesterId: requester.id,
      serviceId: service.id,
      sectorId: sector.id,
    });
    const foreignRequest = await createDomainRequest({
      requesterId: otherRequester.id,
      serviceId: service.id,
      sectorId: sector.id,
    });

    await expect(getRequesterRequest(ownRequest.id, prisma)).resolves.toMatchObject({
      id: ownRequest.id,
      requesterId: requester.id,
      serviceNameSnapshot: service.name,
      events: [],
    });
    await expect(
      getRequesterRequest(foreignRequest.id, prisma),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      getRequesterRequest("00000000-0000-4000-8000-000000000019", prisma),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
