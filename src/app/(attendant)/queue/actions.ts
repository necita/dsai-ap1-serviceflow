"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { transitionRequestStatus } from "@/modules/requests";
import { ApplicationError } from "@/server/errors";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function transition(
  formData: FormData,
  toStatus: "IN_PROGRESS" | "COMPLETED",
  notice: "started" | "completed",
): Promise<never> {
  const requestId = field(formData, "requestId");

  try {
    await transitionRequestStatus({ requestId, toStatus });
  } catch (error) {
    if (error instanceof ApplicationError) {
      const code =
        error.code === "UNAUTHENTICATED" || error.code === "FORBIDDEN"
          ? "access"
          : error.code === "NOT_FOUND"
            ? "missing"
            : error.code === "CONFLICT"
              ? "state"
              : error.code === "VALIDATION_ERROR"
                ? "validation"
                : "unexpected";
      redirect(`/queue/${encodeURIComponent(requestId)}?error=${code}`);
    }

    throw error;
  }

  revalidatePath("/queue");
  revalidatePath(`/queue/${requestId}`);
  redirect(`/queue/${requestId}?notice=${notice}`);
}

export async function startRequestAction(formData: FormData): Promise<never> {
  return transition(formData, "IN_PROGRESS", "started");
}

export async function completeRequestAction(formData: FormData): Promise<never> {
  return transition(formData, "COMPLETED", "completed");
}
