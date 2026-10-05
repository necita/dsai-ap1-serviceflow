import { z } from "zod";

const nonEmptyTextSchema = z.string().trim().min(1);
const uuidSchema = z.uuid();

export const nameSchema = nonEmptyTextSchema;

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const userProfileInputSchema = z
  .object({
    role: z.enum(["ADMIN", "REQUESTER", "ATTENDANT"]),
    sectorId: uuidSchema.nullable().optional(),
  })
  .strict()
  .superRefine((user, context) => {
    const hasSector = user.sectorId !== undefined && user.sectorId !== null;

    if (user.role === "ATTENDANT" && !hasSector) {
      context.addIssue({
        code: "custom",
        path: ["sectorId"],
        message: "Attendants require a sector.",
      });
    }

    if (user.role !== "ATTENDANT" && hasSector) {
      context.addIssue({
        code: "custom",
        path: ["sectorId"],
        message: "Only attendants may be associated with a sector.",
      });
    }
  })
  .transform((user) => ({
    ...user,
    sectorId: user.sectorId ?? null,
  }));

export const sectorInputSchema = z
  .object({
    name: nameSchema,
  })
  .strict();

export const categoryInputSchema = z
  .object({
    name: nameSchema,
  })
  .strict();

export const serviceInputSchema = z
  .object({
    name: nameSchema,
    description: nonEmptyTextSchema,
    categoryId: uuidSchema,
    sectorId: uuidSchema,
  })
  .strict();

export const requestCreationInputSchema = z
  .object({
    serviceId: uuidSchema,
    description: nonEmptyTextSchema.max(10_000),
  })
  .strict();

export type UserProfileInput = z.output<typeof userProfileInputSchema>;
export type SectorInput = z.output<typeof sectorInputSchema>;
export type CategoryInput = z.output<typeof categoryInputSchema>;
export type ServiceInput = z.output<typeof serviceInputSchema>;
export type RequestCreationInput = z.output<typeof requestCreationInputSchema>;
