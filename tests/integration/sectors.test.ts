import { vi, describe, expect, it } from "vitest";
import { prisma } from "./fixtures";
import { ConflictError, NotFoundError, ValidationError } from "@/server/errors";

vi.mock("@/server/authorization", () => ({
  requireConfigurationAdministrator: vi.fn().mockResolvedValue({
    id: "admin-from-server-session",
    role: "ADMIN",
    sectorId: null,
    isActive: true,
  }),
}));

import {
  createSector,
  listSectors,
  setSectorActive,
  updateSector,
} from "@/modules/sectors";

async function createCategory(name: string) {
  return prisma.category.create({ data: { name } });
}

async function createActiveService(sectorId: string) {
  const category = await createCategory("Sector dependency category");
  return prisma.service.create({
    data: {
      name: "Sector dependency service",
      description: "Active service preventing sector deactivation",
      categoryId: category.id,
      sectorId,
    },
  });
}

async function createPendingRequest(sectorId: string) {
  const requester = await prisma.user.create({
    data: {
      name: "Sector request owner",
      email: "sector-owner@example.test",
      role: "REQUESTER",
      passwordHash: "$argon2id$test",
    },
  });
  const category = await createCategory("Pending request category");
  const serviceSector = await prisma.sector.create({
    data: { name: "Different service sector" },
  });
  const service = await prisma.service.create({
    data: {
      name: "Pending request service",
      description: "Service for sector pending-request test",
      categoryId: category.id,
      sectorId: serviceSector.id,
      isActive: false,
    },
  });
  return prisma.request.create({
    data: {
      requesterId: requester.id,
      serviceId: service.id,
      sectorId,
      serviceNameSnapshot: service.name,
      serviceDescriptionSnapshot: service.description,
      categoryIdSnapshot: category.id,
      categoryNameSnapshot: category.name,
      sectorNameSnapshot: "Original request sector",
      description: "Pending request",
      status: "OPEN",
    },
  });
}

describe("sector administration", () => {
  it("creates, lists, and edits trimmed sector names", async () => {
    const created = await createSector({ name: "  Operations  " }, prisma);

    expect(created.name).toBe("Operations");
    await expect(listSectors(prisma)).resolves.toContainEqual(
      expect.objectContaining({ id: created.id, name: "Operations" }),
    );
    await expect(
      updateSector(created.id, { name: "  Customer Support " }, prisma),
    ).resolves.toMatchObject({ name: "Customer Support" });
  });

  it("rejects empty names and active case-insensitive duplicates, and allows reuse after deactivation", async () => {
    const existing = await createSector({ name: "Operations" }, prisma);
    await expect(createSector({ name: "   " }, prisma)).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(
      createSector({ name: "OPERATIONS" }, prisma),
    ).rejects.toBeInstanceOf(ConflictError);
    await setSectorActive(existing.id, false, prisma);
    const reusedName = await createSector({ name: "OPERATIONS" }, prisma);
    expect(reusedName.isActive).toBe(true);
    await expect(
      setSectorActive(existing.id, true, prisma),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      updateSector("00000000-0000-4000-8000-000000000001", { name: "New" }, prisma),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("blocks deactivation with an active service and leaves the sector unchanged", async () => {
    const sector = await createSector({ name: "Sector with service" }, prisma);
    await createActiveService(sector.id);

    await expect(setSectorActive(sector.id, false, prisma)).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(
      prisma.sector.findUniqueOrThrow({ where: { id: sector.id } }),
    ).resolves.toMatchObject({ isActive: true });
  });

  it("blocks deactivation with a pending request and allows it after completion", async () => {
    const sector = await createSector({ name: "Sector with request" }, prisma);
    const request = await createPendingRequest(sector.id);

    await expect(setSectorActive(sector.id, false, prisma)).rejects.toBeInstanceOf(
      ConflictError,
    );

    await prisma.request.update({
      where: { id: request.id },
      data: { status: "COMPLETED" },
    });
    await expect(setSectorActive(sector.id, false, prisma)).resolves.toMatchObject({
      isActive: false,
    });
  });

  it("does not leave an active attendant assigned to an inactive sector", async () => {
    const sector = await createSector({ name: "Attendant sector" }, prisma);
    await prisma.user.create({
      data: {
        name: "Assigned attendant",
        email: "assigned-attendant@example.test",
        role: "ATTENDANT",
        sectorId: sector.id,
        passwordHash: "$argon2id$test",
      },
    });

    await expect(setSectorActive(sector.id, false, prisma)).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(
      prisma.sector.findUniqueOrThrow({ where: { id: sector.id } }),
    ).resolves.toMatchObject({ isActive: true });
  });

  it("reactivates a sector without physically deleting it", async () => {
    const sector = await createSector({ name: "Reactivatable sector" }, prisma);
    await setSectorActive(sector.id, false, prisma);

    await expect(setSectorActive(sector.id, true, prisma)).resolves.toMatchObject({
      id: sector.id,
      isActive: true,
    });
    await expect(prisma.sector.count({ where: { id: sector.id } })).resolves.toBe(1);
  });
});
