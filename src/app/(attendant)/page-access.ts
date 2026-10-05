import { redirect } from "next/navigation";
import { requireCurrentActor, assertRole } from "@/server/authorization";
import { AuthenticationError, AuthorizationError } from "@/server/errors";

export async function requireAttendantPageAccess(): Promise<void> {
  try {
    assertRole(await requireCurrentActor(), "ATTENDANT");
  } catch (error) {
    if (error instanceof AuthenticationError) redirect("/login");
    if (error instanceof AuthorizationError) redirect("/");
    throw error;
  }
}
