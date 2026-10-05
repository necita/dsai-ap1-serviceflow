import {
  Prisma,
  type PrismaClient,
  type Sector,
} from "@prisma/client";
import { validateInput } from "@/server/validation";
import { ConflictError, NotFoundError } from "@/server/errors";
import { requireConfigurationAdministrator } from "@/server/authorization";
import { prisma } from "@/server/db";
import { sectorInputSchema } from "@/shared/validation";
import { assertSectorCanBeDeactivated } from "./policy";

export { assertSectorCanBeDeactivated } from "./policy";

export async function listSectors(
  database: PrismaClient = prisma,
): Promise<Sector[]> {
  await requireConfigurationAdministrator();

  return database.sector.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createSector(
  input: unknown,
  database: PrismaClient = prisma,
): Promise<Sector> {
  await requireConfigurationAdministrator();
  const { name } = validateInput(sectorInputSchema, input);

  try {
    return await database.$transaction(
      (transaction) => transaction.sector.create({ data: { name } }),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    throw mapSectorPersistenceError(error);
  }
}

export async function updateSector(
  id: string,
  input: unknown,
  database: PrismaClient = prisma,
): Promise<Sector> {
  await requireConfigurationAdministrator();
  const { name } = validateInput(sectorInputSchema, input);

  try {
    return await database.$transaction(
      async (transaction) => {
        const current = await transaction.sector.findUnique({
          where: { id },
          select: { id: true },
        });

        if (!current) {
          throw new NotFoundError();
        }

        return transaction.sector.update({
          where: { id },
          data: { name },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    throw mapSectorPersistenceError(error);
  }
}

export async function setSectorActive(
  id: string,
  isActive: boolean,
  database: PrismaClient = prisma,
): Promise<Sector> {
  await requireConfigurationAdministrator();

  try {
    return await database.$transaction(
      async (transaction) => {
        const current = await transaction.sector.findUnique({
          where: { id },
          select: { id: true },
        });

        if (!current) {
          throw new NotFoundError();
        }

        if (!isActive) {
          const [activeServices, activeAttendants, pendingRequests] = await Promise.all([
            transaction.service.count({
              where: { sectorId: id, isActive: true },
            }),
            transaction.user.count({
              where: { sectorId: id, role: "ATTENDANT", isActive: true },
            }),
            transaction.request.count({
              where: {
                sectorId: id,
                status: { in: ["OPEN", "IN_PROGRESS"] },
              },
            }),
          ]);

          assertSectorCanBeDeactivated({
            hasActiveService: activeServices > 0,
            hasPendingRequest: pendingRequests > 0,
            hasActiveAttendant: activeAttendants > 0,
          });
        }

        return transaction.sector.update({
          where: { id },
          data: { isActive },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    throw mapSectorPersistenceError(error);
  }
}

function mapSectorPersistenceError(error: unknown): Error {
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

  return error instanceof Error ? error : new Error("Sector operation failed.");
}
