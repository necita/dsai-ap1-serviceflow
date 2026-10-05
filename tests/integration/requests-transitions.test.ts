import { vi, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./fixtures";
import { ConflictError, NotFoundError } from "@/server/errors";
import {
  createDomainCategory,
  createDomainRequest,
  createDomainSector,
  createDomainService,
  createDomainUser,
} from "./domain-fixtures";

const authenticated = vi.hoisted(() => ({
  requireStatusChangeActor: vi.fn(),
}));

vi.mock("@/server/authorization", () => authenticated);

import { transitionRequestStatus } from "@/modules/requests";

describe("transactional request status transitions", () => {
  beforeEach(async () => {
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS reject_serviceflow_transition_event ON public."RequestStatusEvent";
    `);
    await prisma.$executeRawUnsafe(`
      DROP FUNCTION IF EXISTS public.reject_serviceflow_transition_event();
    `);
  });

  async function createOpenRequest() {
    const requester = await createDomainUser({ role: "REQUESTER" });
    const sector = await createDomainSector();
    const attendant = await createDomainUser({
      role: "ATTENDANT",
      sectorId: sector.id,
    });
    const category = await createDomainCategory();
    const service = await createDomainService({
      categoryId: category.id,
      sectorId: sector.id,
    });
    const request = await createDomainRequest({
      requesterId: requester.id,
      serviceId: service.id,
      sectorId: sector.id,
    });
    authenticated.requireStatusChangeActor.mockResolvedValue({
      actorId: attendant.id,
      sectorId: sector.id,
    });

    return { request, attendant, sector };
  }

  it("applies only the requested next state and appends events transactionally", async () => {
    const { request, attendant } = await createOpenRequest();
    const previousUpdatedAt = request.updatedAt;

    const inProgress = await transitionRequestStatus(
      { requestId: request.id, toStatus: "IN_PROGRESS" },
      prisma,
    );

    expect(inProgress.status).toBe("IN_PROGRESS");
    expect(inProgress.updatedAt.getTime()).toBeGreaterThanOrEqual(
      previousUpdatedAt.getTime(),
    );
    expect(inProgress.completedAt).toBeNull();
    expect(inProgress.events).toHaveLength(1);
    expect(inProgress.events[0]).toMatchObject({
      actorId: attendant.id,
      fromStatus: "OPEN",
      toStatus: "IN_PROGRESS",
    });

    const completed = await transitionRequestStatus(
      { requestId: request.id, toStatus: "COMPLETED" },
      prisma,
    );
    expect(completed.status).toBe("COMPLETED");
    expect(completed.completedAt).toBeInstanceOf(Date);
    expect(completed.events).toHaveLength(2);
    expect(completed.events.map(({ toStatus }) => toStatus)).toEqual([
      "IN_PROGRESS",
      "COMPLETED",
    ]);

    await expect(
      transitionRequestStatus(
        { requestId: request.id, toStatus: "COMPLETED" },
        prisma,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(prisma.requestStatusEvent.count()).resolves.toBe(2);
  });

  it("does not persist invalid or unauthorized transitions", async () => {
    const { request } = await createOpenRequest();

    await expect(
      transitionRequestStatus(
        { requestId: request.id, toStatus: "COMPLETED" },
        prisma,
      ),
    ).rejects.toBeInstanceOf(ConflictError);

    authenticated.requireStatusChangeActor.mockRejectedValue(new NotFoundError());
    await expect(
      transitionRequestStatus(
        { requestId: request.id, toStatus: "IN_PROGRESS" },
        prisma,
      ),
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(
      prisma.request.findUniqueOrThrow({ where: { id: request.id } }),
    ).resolves.toMatchObject({ status: "OPEN" });
    await expect(prisma.requestStatusEvent.count()).resolves.toBe(0);
  });

  it("allows at most one transition from a state when called concurrently", async () => {
    const { request } = await createOpenRequest();
    const results = await Promise.allSettled([
      transitionRequestStatus(
        { requestId: request.id, toStatus: "IN_PROGRESS" },
        prisma,
      ),
      transitionRequestStatus(
        { requestId: request.id, toStatus: "IN_PROGRESS" },
        prisma,
      ),
    ]);

    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(1);
    await expect(
      prisma.request.findUniqueOrThrow({ where: { id: request.id } }),
    ).resolves.toMatchObject({ status: "IN_PROGRESS" });
    await expect(prisma.requestStatusEvent.count()).resolves.toBe(1);
  });

  it("rolls back the status update if appending its event fails", async () => {
    const { request } = await createOpenRequest();
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION public.reject_serviceflow_transition_event()
      RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION 'integration event failure';
      END;
      $$;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER reject_serviceflow_transition_event
      BEFORE INSERT ON public."RequestStatusEvent"
      FOR EACH ROW EXECUTE FUNCTION public.reject_serviceflow_transition_event();
    `);

    try {
      await expect(
        transitionRequestStatus(
          { requestId: request.id, toStatus: "IN_PROGRESS" },
          prisma,
        ),
      ).rejects.toThrow();
      await expect(
        prisma.request.findUniqueOrThrow({ where: { id: request.id } }),
      ).resolves.toMatchObject({ status: "OPEN", completedAt: null });
      await expect(prisma.requestStatusEvent.count()).resolves.toBe(0);
    } finally {
      await prisma.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS reject_serviceflow_transition_event ON public."RequestStatusEvent";
      `);
      await prisma.$executeRawUnsafe(`
        DROP FUNCTION IF EXISTS public.reject_serviceflow_transition_event();
      `);
    }
  });
});
