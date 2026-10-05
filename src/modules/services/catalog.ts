import type { Prisma, PrismaClient } from "@prisma/client";
import { requirePublishedCatalogReader } from "@/server/authorization";
import { NotFoundError } from "@/server/errors";
import { prisma } from "@/server/db";
import { entityIdSchema } from "@/shared/validation";
import { validateInput } from "@/server/validation";

const publishedServiceInclude = {
  category: { select: { id: true, name: true } },
  sector: { select: { id: true, name: true } },
} satisfies Prisma.ServiceInclude;

export type PublishedService = Prisma.ServiceGetPayload<{
  include: typeof publishedServiceInclude;
}>;

export async function listPublishedServices(
  database: PrismaClient = prisma,
): Promise<PublishedService[]> {
  await requirePublishedCatalogReader();

  return database.service.findMany({
    where: {
      isActive: true,
      category: { isActive: true },
      sector: { isActive: true },
    },
    include: publishedServiceInclude,
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }, { id: "asc" }],
  });
}

export async function getPublishedService(
  id: unknown,
  database: PrismaClient = prisma,
): Promise<PublishedService> {
  await requirePublishedCatalogReader();
  const serviceId = validateInput(entityIdSchema, id);

  const service = await database.service.findFirst({
    where: {
      id: serviceId,
      isActive: true,
      category: { isActive: true },
      sector: { isActive: true },
    },
    include: publishedServiceInclude,
  });

  if (!service) {
    throw new NotFoundError();
  }

  return service;
}

export function groupPublishedServices(
  services: PublishedService[],
): Map<string, PublishedService[]> {
  const groups = new Map<string, PublishedService[]>();

  for (const service of services) {
    const group = groups.get(service.category.name) ?? [];
    group.push(service);
    groups.set(service.category.name, group);
  }

  return groups;
}
