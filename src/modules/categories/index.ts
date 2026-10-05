import {
  Prisma,
  type Category,
  type PrismaClient,
} from "@prisma/client";
import { requireConfigurationAdministrator } from "@/server/authorization";
import { ConflictError, NotFoundError } from "@/server/errors";
import { prisma } from "@/server/db";
import {
  activeStateSchema,
  categoryInputSchema,
  entityIdSchema,
} from "@/shared/validation";
import { validateInput } from "@/server/validation";
import { assertCategoryCanBeDeactivated } from "./policy";

export { assertCategoryCanBeDeactivated } from "./policy";

export async function listCategories(
  database: PrismaClient = prisma,
): Promise<Category[]> {
  await requireConfigurationAdministrator();

  return database.category.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createCategory(
  input: unknown,
  database: PrismaClient = prisma,
): Promise<Category> {
  await requireConfigurationAdministrator();
  const { name } = validateInput(categoryInputSchema, input);

  try {
    return await database.$transaction(
      (transaction) => transaction.category.create({ data: { name } }),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    throw mapCategoryPersistenceError(error);
  }
}

export async function updateCategory(
  id: unknown,
  input: unknown,
  database: PrismaClient = prisma,
): Promise<Category> {
  await requireConfigurationAdministrator();
  const categoryId = validateInput(entityIdSchema, id);
  const { name } = validateInput(categoryInputSchema, input);

  try {
    return await database.$transaction(
      async (transaction) => {
        const current = await transaction.category.findUnique({
          where: { id: categoryId },
          select: { id: true },
        });

        if (!current) {
          throw new NotFoundError();
        }

        return transaction.category.update({
          where: { id: categoryId },
          data: { name },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    throw mapCategoryPersistenceError(error);
  }
}

export async function setCategoryActive(
  id: unknown,
  isActive: unknown,
  database: PrismaClient = prisma,
): Promise<Category> {
  await requireConfigurationAdministrator();
  const categoryId = validateInput(entityIdSchema, id);
  const active = validateInput(activeStateSchema, isActive);

  try {
    return await database.$transaction(
      async (transaction) => {
        const current = await transaction.category.findUnique({
          where: { id: categoryId },
          select: { id: true },
        });

        if (!current) {
          throw new NotFoundError();
        }

        if (!active) {
          const activeServices = await transaction.service.count({
            where: { categoryId, isActive: true },
          });
          assertCategoryCanBeDeactivated(activeServices > 0);
        }

        return transaction.category.update({
          where: { id: categoryId },
          data: { isActive: active },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    throw mapCategoryPersistenceError(error);
  }
}

function mapCategoryPersistenceError(error: unknown): Error {
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

  return error instanceof Error ? error : new Error("Category operation failed.");
}
