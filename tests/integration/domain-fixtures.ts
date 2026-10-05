import { randomUUID } from "node:crypto";
import type { RequestStatus, Role } from "@prisma/client";
import { prisma } from "./fixtures";

export async function createDomainSector(isActive = true) {
  return prisma.sector.create({
    data: {
      name: `Domain sector ${randomUUID()}`,
      isActive,
    },
  });
}

export async function createDomainCategory(isActive = true) {
  return prisma.category.create({
    data: {
      name: `Domain category ${randomUUID()}`,
      isActive,
    },
  });
}

export async function createDomainUser(input: {
  role: Role;
  sectorId?: string | null;
  isActive?: boolean;
  email?: string;
}) {
  return prisma.user.create({
    data: {
      name: "Domain test user",
      email: input.email ?? `user-${randomUUID()}@example.test`,
      role: input.role,
      sectorId: input.sectorId,
      passwordHash: "$argon2id$integration-placeholder",
      isActive: input.isActive,
    },
  });
}

export async function createDomainService(input: {
  categoryId: string;
  sectorId: string;
  isActive?: boolean;
}) {
  return prisma.service.create({
    data: {
      name: `Domain service ${randomUUID()}`,
      description: "Service fixture for domain integration tests",
      categoryId: input.categoryId,
      sectorId: input.sectorId,
      isActive: input.isActive,
    },
  });
}

export async function createDomainRequest(input: {
  requesterId: string;
  serviceId: string;
  sectorId: string;
  status?: RequestStatus;
}) {
  const service = await prisma.service.findUniqueOrThrow({
    where: { id: input.serviceId },
    include: { category: true },
  });
  const sector = await prisma.sector.findUniqueOrThrow({
    where: { id: input.sectorId },
  });

  return prisma.request.create({
    data: {
      requesterId: input.requesterId,
      serviceId: service.id,
      sectorId: sector.id,
      serviceNameSnapshot: service.name,
      serviceDescriptionSnapshot: service.description,
      categoryIdSnapshot: service.categoryId,
      categoryNameSnapshot: service.category.name,
      sectorNameSnapshot: sector.name,
      description: "Domain fixture request",
      status: input.status,
    },
  });
}
