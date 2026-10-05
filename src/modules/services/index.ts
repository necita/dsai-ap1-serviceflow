import {
  Prisma,
  type PrismaClient,
  type Service,
} from "@prisma/client";
import { requireConfigurationAdministrator } from "@/server/authorization";
import { ConflictError, NotFoundError } from "@/server/errors";
import { prisma } from "@/server/db";
import {
  activeStateSchema,
  entityIdSchema,
  serviceInputSchema,
} from "@/shared/validation";
import { validateInput } from "@/server/validation";
import { assertServiceRelationships } from "./policy";

export {
  assertServiceCanReceiveRequests,
  assertServiceRelationships,
} from "./policy";

export async function listServices(
  database: PrismaClient = prisma,
): Promise<Service[]> {
  await requireConfigurationAdministrator();

  return database.service.findMany({
    include: {
      category: true,
      sector: true,
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

export async function createService(
  input: unknown,
  database: PrismaClient = prisma,
): Promise<Service> {
  await requireConfigurationAdministrator();
  const parsed = validateInput(serviceInputSchema, input);

  try {
    return await database.$transaction(
      async (transaction) => {
        const relationships = await loadServiceRelationships(
          transaction,
          parsed.categoryId,
          parsed.sectorId,
        );
        assertServiceRelationships(relationships, true);

        return transaction.service.create({
          data: parsed,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    throw mapServicePersistenceError(error);
  }
}

export async function updateService(
  id: unknown,
  input: unknown,
  database: PrismaClient = prisma,
): Promise<Service> {
  await requireConfigurationAdministrator();
  const serviceId = validateInput(entityIdSchema, id);
  const parsed = validateInput(serviceInputSchema, input);

  try {
    return await database.$transaction(
      async (transaction) => {
        const current = await transaction.service.findUnique({
          where: { id: serviceId },
          select: { id: true, isActive: true },
        });

        if (!current) {
          throw new NotFoundError();
        }

        const relationships = await loadServiceRelationships(
          transaction,
          parsed.categoryId,
          parsed.sectorId,
        );
        assertServiceRelationships(relationships, current.isActive);

        return transaction.service.update({
          where: { id: serviceId },
          data: parsed,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    throw mapServicePersistenceError(error);
  }
}

export async function setServiceActive(
  id: unknown,
  isActive: unknown,
  database: PrismaClient = prisma,
): Promise<Service> {
  await requireConfigurationAdministrator();
  const serviceId = validateInput(entityIdSchema, id);
  const active = validateInput(activeStateSchema, isActive);

  try {
    return await database.$transaction(
      async (transaction) => {
        const current = await transaction.service.findUnique({
          where: { id: serviceId },
          select: {
            id: true,
            categoryId: true,
            sectorId: true,
          },
        });

        if (!current) {
          throw new NotFoundError();
        }

        if (active) {
          const relationships = await loadServiceRelationships(
            transaction,
            current.categoryId,
            current.sectorId,
          );
          assertServiceRelationships(relationships, true);
        }

        return transaction.service.update({
          where: { id: serviceId },
          data: { isActive: active },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    throw mapServicePersistenceError(error);
  }
}

async function loadServiceRelationships(
  transaction: Prisma.TransactionClient,
  categoryId: string,
  sectorId: string,
) {
  const [category, sector] = await Promise.all([
    transaction.category.findUnique({
      where: { id: categoryId },
      select: { isActive: true },
    }),
    transaction.sector.findUnique({
      where: { id: sectorId },
      select: { isActive: true },
    }),
  ]);

  return {
    categoryExists: category !== null,
    categoryActive: category?.isActive ?? false,
    sectorExists: sector !== null,
    sectorActive: sector?.isActive ?? false,
  };
}

function mapServicePersistenceError(error: unknown): Error {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return new ConflictError();
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2025" || error.code === "P2003")
  ) {
    return new NotFoundError();
  }

  return error instanceof Error ? error : new Error("Service operation failed.");
}
