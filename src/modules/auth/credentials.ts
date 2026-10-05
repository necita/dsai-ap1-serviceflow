import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db";
import { emailSchema } from "@/shared/validation";
import { z } from "zod";
import { verifyPassword } from "./password";

const credentialsSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1),
  })
  .strict();

export interface AuthenticatedCredentials {
  id: string;
  name: string;
  email: string;
}

export async function authenticateCredentials(
  credentials: unknown,
  database: PrismaClient = prisma,
): Promise<AuthenticatedCredentials | null> {
  const parsed = credentialsSchema.safeParse(credentials);

  if (!parsed.success) {
    return null;
  }

  const user = await database.user.findUnique({
    where: { email: parsed.data.email },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      isActive: true,
    },
  });

  if (!user?.isActive || !(await verifyPassword(user.passwordHash, parsed.data.password))) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
