import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { ConflictError, ValidationError } from "@/server/errors";
import { emailSchema, nameSchema } from "@/shared/validation";
import { hashPassword } from "./password";

const bootstrapAdminInputSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: z.string().min(1),
  })
  .strict();

export interface BootstrapAdminResult {
  id: string;
  name: string;
  email: string;
}

export async function bootstrapFirstAdmin(
  input: unknown,
  database: PrismaClient,
): Promise<BootstrapAdminResult> {
  const parsed = bootstrapAdminInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues.map(({ path, code }) => ({
        path: path.filter(
          (segment): segment is string | number =>
            typeof segment === "string" || typeof segment === "number",
        ),
        code,
      })),
    );
  }

  if (await database.user.count({ where: { role: "ADMIN" } })) {
    throw new ConflictError();
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    return await database.$transaction(
      async (transaction) => {
        if (await transaction.user.count({ where: { role: "ADMIN" } })) {
          throw new ConflictError();
        }

        return transaction.user.create({
          data: {
            name: parsed.data.name,
            email: parsed.data.email,
            role: "ADMIN",
            sectorId: null,
            passwordHash,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034" &&
      (await database.user.count({ where: { role: "ADMIN" } }))
    ) {
      throw new ConflictError();
    }

    throw error;
  }
}
