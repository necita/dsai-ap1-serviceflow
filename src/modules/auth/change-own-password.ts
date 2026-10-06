import type { PrismaClient } from "@prisma/client";
import { requireCurrentActor } from "@/server/authorization";
import { AuthenticationError, ConflictError } from "@/server/errors";
import { prisma } from "@/server/db";
import { validateInput } from "@/server/validation";
import { ownPasswordChangeInputSchema } from "@/shared/validation";
import { hashPassword, verifyPassword } from "./password";

export class CurrentPasswordMismatchError extends Error {
  constructor() {
    super("Current password verification failed.");
    this.name = "CurrentPasswordMismatchError";
  }
}

export async function changeOwnPassword(
  input: unknown,
  database: PrismaClient = prisma,
): Promise<void> {
  const actor = await requireCurrentActor();
  const parsed = validateInput(ownPasswordChangeInputSchema, input);

  const user = await database.user.findUnique({
    where: { id: actor.id },
    select: { passwordHash: true, isActive: true },
  });

  if (!user?.isActive) {
    throw new AuthenticationError();
  }

  if (!(await verifyPassword(user.passwordHash, parsed.currentPassword))) {
    throw new CurrentPasswordMismatchError();
  }

  const passwordHash = await hashPassword(parsed.newPassword);
  const result = await database.user.updateMany({
    where: {
      id: actor.id,
      passwordHash: user.passwordHash,
      isActive: true,
    },
    data: { passwordHash },
  });

  if (result.count !== 1) {
    throw new ConflictError();
  }
}
