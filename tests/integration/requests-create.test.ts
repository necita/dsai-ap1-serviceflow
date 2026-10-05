import { vi, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./fixtures";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/server/errors";
import {
  createDomainCategory,
  createDomainSector,
  createDomainService,
  createDomainUser,
} from "./domain-fixtures";

const authenticated = vi.hoisted(() => ({
  requireRequestCreator: vi.fn(),
}));

vi.mock("@/server/authorization", () => authenticated);

import { createRequest } from "@/modules/requests";

describe("transactional requester operation creation", () => {
  beforeEach(async () => {
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS reject_serviceflow_initial_event ON public."RequestStatusEvent";
    `);
    await prisma.$executeRawUnsafe(`
      DROP FUNCTION IF EXISTS public.reject_serviceflow_initial_event();
    `);
  });

  it("creates OPEN request snapshots and exactly one initial event from current database data", async () => {
    const requester = await createDomainUser({ role: "REQUESTER" });
    authenticated.requireRequestCreator.mockResolvedValue(requester);
    const category = await createDomainCategory();
    const sector = await createDomainSector();
    const service = await createDomainService({
      categoryId: category.id,
      sectorId: sector.id,
    });

    const created = await createRequest(
      {
        serviceId: service.id,
        description: "  Please provide access  ",
      },
      prisma,
    );

    expect(created).toMatchObject({
      requesterId: requester.id,
      serviceId: service.id,
      sectorId: sector.id,
      status: "OPEN",
      description: "Please provide access",
      serviceNameSnapshot: service.name,
      serviceDescriptionSnapshot: service.description,
      categoryIdSnapshot: category.id,
      categoryNameSnapshot: category.name,
      sectorNameSnapshot: sector.name,
    });
    expect(created.events).toHaveLength(1);
    expect(created.events[0]).toMatchObject({
      actorId: requester.id,
      fromStatus: null,
      toStatus: "OPEN",
    });
  });

  it("rejects forged protected properties before writing anything", async () => {
    const requester = await createDomainUser({ role: "REQUESTER" });
    authenticated.requireRequestCreator.mockResolvedValue(requester);
    const category = await createDomainCategory();
    const sector = await createDomainSector();
    const service = await createDomainService({
      categoryId: category.id,
      sectorId: sector.id,
    });

    await expect(
      createRequest(
        {
          serviceId: service.id,
          description: "Request",
          requesterId: "forged-requester",
          sectorId: "forged-sector",
          status: "COMPLETED",
          createdAt: "2026-01-01",
        },
        prisma,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(prisma.request.count()).resolves.toBe(0);
    await expect(prisma.requestStatusEvent.count()).resolves.toBe(0);
  });

  it("rejects missing or currently unavailable service configuration", async () => {
    const requester = await createDomainUser({ role: "REQUESTER" });
    authenticated.requireRequestCreator.mockResolvedValue(requester);
    const category = await createDomainCategory();
    const sector = await createDomainSector();
    const service = await createDomainService({
      categoryId: category.id,
      sectorId: sector.id,
      isActive: false,
    });

    await expect(
      createRequest(
        { serviceId: "00000000-0000-4000-8000-000000000017", description: "Test" },
        prisma,
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      createRequest({ serviceId: service.id, description: "Test" }, prisma),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(prisma.request.count()).resolves.toBe(0);
    await expect(prisma.requestStatusEvent.count()).resolves.toBe(0);

    const availableService = await createDomainService({
      categoryId: category.id,
      sectorId: sector.id,
    });
    await prisma.sector.update({
      where: { id: sector.id },
      data: { isActive: false },
    });
    await expect(
      createRequest(
        { serviceId: availableService.id, description: "Test" },
        prisma,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects blank and oversized descriptions before persistence", async () => {
    const requester = await createDomainUser({ role: "REQUESTER" });
    authenticated.requireRequestCreator.mockResolvedValue(requester);

    await expect(
      createRequest({ serviceId: "00000000-0000-4000-8000-000000000018", description: " " }, prisma),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      createRequest({
        serviceId: "00000000-0000-4000-8000-000000000018",
        description: "x".repeat(10_001),
      }, prisma),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rolls back a request when initial event insertion fails", async () => {
    const requester = await createDomainUser({ role: "REQUESTER" });
    authenticated.requireRequestCreator.mockResolvedValue(requester);
    const category = await createDomainCategory();
    const sector = await createDomainSector();
    const service = await createDomainService({
      categoryId: category.id,
      sectorId: sector.id,
    });

    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION public.reject_serviceflow_initial_event()
      RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION 'integration event failure';
      END;
      $$;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER reject_serviceflow_initial_event
      BEFORE INSERT ON public."RequestStatusEvent"
      FOR EACH ROW EXECUTE FUNCTION public.reject_serviceflow_initial_event();
    `);

    try {
      await expect(
        createRequest({ serviceId: service.id, description: "Rollback test" }, prisma),
      ).rejects.toThrow();
      await expect(prisma.request.count()).resolves.toBe(0);
      await expect(prisma.requestStatusEvent.count()).resolves.toBe(0);
    } finally {
      await prisma.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS reject_serviceflow_initial_event ON public."RequestStatusEvent";
      `);
      await prisma.$executeRawUnsafe(`
        DROP FUNCTION IF EXISTS public.reject_serviceflow_initial_event();
      `);
    }
  });
});
