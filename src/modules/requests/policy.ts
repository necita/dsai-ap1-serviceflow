import type { Category, Sector, Service } from "@prisma/client";

export type RequestSnapshotSource = Pick<
  Service,
  "id" | "name" | "description"
> & {
  category: Pick<Category, "id" | "name">;
  sector: Pick<Sector, "id" | "name">;
};

export function buildRequestSnapshot(
  requesterId: string,
  service: RequestSnapshotSource,
) {
  return {
    requesterId,
    serviceId: service.id,
    sectorId: service.sector.id,
    serviceNameSnapshot: service.name,
    serviceDescriptionSnapshot: service.description,
    categoryIdSnapshot: service.category.id,
    categoryNameSnapshot: service.category.name,
    sectorNameSnapshot: service.sector.name,
  };
}
import type { RequestStatus } from "@prisma/client";
import { ConflictError } from "@/server/errors";

export function assertRequestStatusTransition(
  fromStatus: RequestStatus,
  toStatus: RequestStatus,
): void {
  const isAllowed =
    (fromStatus === "OPEN" && toStatus === "IN_PROGRESS") ||
    (fromStatus === "IN_PROGRESS" && toStatus === "COMPLETED");

  if (!isAllowed) {
    throw new ConflictError();
  }
}
