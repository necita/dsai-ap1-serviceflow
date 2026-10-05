import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { prisma } from "./fixtures";
import {
  assertRequestReadable,
  assertStatusChangeAllowed,
  type AuthorizationActor,
} from "@/server/authorization/policy";
import { AuthenticationError, NotFoundError } from "@/server/errors";

describe("authorization with persisted users and sectors", () => {
  async function createSector(name: string) {
    return prisma.sector.create({ data: { name } });
  }

  async function createUser(input: {
    email: string;
    role: "ADMIN" | "REQUESTER" | "ATTENDANT";
    sectorId?: string | null;
    isActive?: boolean;
  }): Promise<AuthorizationActor> {
    const user = await prisma.user.create({
      data: {
        name: input.email,
        email: input.email,
        role: input.role,
        sectorId: input.sectorId,
        passwordHash: "$argon2id$integration-placeholder",
        isActive: input.isActive,
      },
      select: {
        id: true,
        role: true,
        sectorId: true,
        isActive: true,
      },
    });

    return user;
  }

  async function createRequest(requesterId: string, sectorId: string) {
    const category = await prisma.category.create({
      data: { name: `Category ${randomUUID()}` },
    });
    const serviceSector = await createSector(`Service sector ${randomUUID()}`);
    const service = await prisma.service.create({
      data: {
        name: "Authorization service",
        description: "Service for authorization integration testing",
        categoryId: category.id,
        sectorId: serviceSector.id,
      },
    });

    return prisma.request.create({
      data: {
        requesterId,
        serviceId: service.id,
        sectorId,
        serviceNameSnapshot: service.name,
        serviceDescriptionSnapshot: service.description,
        categoryIdSnapshot: category.id,
        categoryNameSnapshot: category.name,
        sectorNameSnapshot: "Request sector",
        description: "Test request",
      },
      select: {
        id: true,
        requesterId: true,
        sectorId: true,
      },
    });
  }

  it("authorizes request ownership and hides other users' requests", async () => {
    const owner = await createUser({
      email: "owner@example.test",
      role: "REQUESTER",
    });
    const other = await createUser({
      email: "other@example.test",
      role: "REQUESTER",
    });
    const sector = await createSector("Request routing sector");
    const request = await createRequest(owner.id, sector.id);

    expect(() => assertRequestReadable(owner, request)).not.toThrow();
    expect(() => assertRequestReadable(other, request)).toThrow(NotFoundError);
  });

  it("authorizes attendants by the request's persisted sector, not the service's sector", async () => {
    const requestSector = await createSector("Persisted request sector");
    const attendantSector = await createSector("Current attendant sector");
    const outsideSector = await createSector("Different sector");
    const requester = await createUser({
      email: "requester@example.test",
      role: "REQUESTER",
    });
    const attendant = await createUser({
      email: "attendant@example.test",
      role: "ATTENDANT",
      sectorId: requestSector.id,
    });
    const matchingAttendant = await createUser({
      email: "matching@example.test",
      role: "ATTENDANT",
      sectorId: requestSector.id,
    });
    const outsideAttendant = await createUser({
      email: "outside@example.test",
      role: "ATTENDANT",
      sectorId: outsideSector.id,
    });
    const request = await createRequest(requester.id, requestSector.id);

    await prisma.user.update({
      where: { id: attendant.id },
      data: { sectorId: attendantSector.id },
    });
    const currentAttendant = await prisma.user.findUniqueOrThrow({
      where: { id: attendant.id },
      select: { id: true, role: true, sectorId: true, isActive: true },
    });

    expect(() =>
      assertRequestReadable(matchingAttendant, {
        requesterId: request.requesterId,
        sectorId: request.sectorId,
      }),
    ).not.toThrow();
    expect(
      assertStatusChangeAllowed(matchingAttendant, {
        requesterId: request.requesterId,
        sectorId: request.sectorId,
      }),
    ).toEqual({
      actorId: matchingAttendant.id,
      sectorId: requestSector.id,
    });
    expect(() =>
      assertRequestReadable(currentAttendant, {
        requesterId: request.requesterId,
        sectorId: request.sectorId,
      }),
    ).toThrow(NotFoundError);
    expect(() =>
      assertStatusChangeAllowed(currentAttendant, {
        requesterId: request.requesterId,
        sectorId: request.sectorId,
      }),
    ).toThrow(NotFoundError);
    expect(() =>
      assertRequestReadable(outsideAttendant, {
        requesterId: request.requesterId,
        sectorId: request.sectorId,
      }),
    ).toThrow(NotFoundError);
  });

  it("rejects inactive persisted actors and administrators from operational request access", async () => {
    const sector = await createSector("Authorization sector");
    const requester = await createUser({
      email: "inactive@example.test",
      role: "REQUESTER",
      isActive: false,
    });
    const admin = await createUser({
      email: "admin@example.test",
      role: "ADMIN",
    });
    const owner = await createUser({
      email: "active-owner@example.test",
      role: "REQUESTER",
    });
    const request = await createRequest(owner.id, sector.id);

    expect(() => assertRequestReadable(requester, request)).toThrow(
      AuthenticationError,
    );
    expect(() => assertRequestReadable(admin, request)).toThrow(NotFoundError);
  });
});
