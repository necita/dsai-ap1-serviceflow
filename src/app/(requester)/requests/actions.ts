"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createRequest } from "@/modules/requests";
import { ApplicationError } from "@/server/errors";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createRequestAction(formData: FormData): Promise<never> {
  const serviceId = field(formData, "serviceId");
  let requestId: string;

  try {
    const request = await createRequest({
      serviceId,
      description: field(formData, "description"),
    });
    requestId = request.id;
  } catch (error) {
    if (error instanceof ApplicationError) {
      const code =
        error.code === "VALIDATION_ERROR"
          ? "validation"
          : error.code === "UNAUTHENTICATED" || error.code === "FORBIDDEN"
            ? "access"
            : error.code === "NOT_FOUND" || error.code === "CONFLICT"
              ? "unavailable"
              : "unexpected";
      redirect(`/catalog/${encodeURIComponent(serviceId)}?error=${code}`);
    }

    throw error;
  }

  revalidatePath("/catalog");
  revalidatePath("/requests");
  redirect(`/requests/${requestId}?notice=created`);
}
