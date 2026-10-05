"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApplicationError } from "@/server/errors";
import { activeStateInputSchema } from "@/shared/validation";
import { validateInput } from "@/server/validation";
import {
  createSector,
  setSectorActive,
  updateSector,
} from "@/modules/sectors";
import {
  createCategory,
  setCategoryActive,
  updateCategory,
} from "@/modules/categories";
import {
  createUser,
  setUserActive,
  updateUser,
} from "@/modules/users";
import {
  createService,
  setServiceActive,
  updateService,
} from "@/modules/services";

type Entity = "sectors" | "categories" | "users" | "services";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function activeState(formData: FormData): boolean {
  return validateInput(activeStateInputSchema, field(formData, "isActive"));
}

function reportFailure(entity: Entity, error: unknown): never {
  if (error instanceof ApplicationError) {
    const code =
      error.code === "VALIDATION_ERROR"
        ? "validation"
        : error.code === "CONFLICT"
          ? "dependency"
          : error.code === "NOT_FOUND"
            ? "missing"
            : error.code === "UNAUTHENTICATED" || error.code === "FORBIDDEN"
              ? "access"
              : "unexpected";
    redirect(`/admin?error=${code}&entity=${entity}`);
  }

  throw error;
}

async function finish(entity: Entity, message: string): Promise<never> {
  revalidatePath("/admin");
  redirect(`/admin?notice=${message}&entity=${entity}`);
}

export async function createSectorAction(formData: FormData): Promise<never> {
  try {
    await createSector({ name: field(formData, "name") });
  } catch (error) {
    reportFailure("sectors", error);
  }
  return finish("sectors", "created");
}

export async function updateSectorAction(formData: FormData): Promise<never> {
  try {
    await updateSector(field(formData, "id"), {
      name: field(formData, "name"),
    });
  } catch (error) {
    reportFailure("sectors", error);
  }
  return finish("sectors", "updated");
}

export async function toggleSectorAction(formData: FormData): Promise<never> {
  try {
    await setSectorActive(
      field(formData, "id"),
      activeState(formData),
    );
  } catch (error) {
    reportFailure("sectors", error);
  }
  return finish("sectors", "status");
}

export async function createCategoryAction(formData: FormData): Promise<never> {
  try {
    await createCategory({ name: field(formData, "name") });
  } catch (error) {
    reportFailure("categories", error);
  }
  return finish("categories", "created");
}

export async function updateCategoryAction(formData: FormData): Promise<never> {
  try {
    await updateCategory(field(formData, "id"), {
      name: field(formData, "name"),
    });
  } catch (error) {
    reportFailure("categories", error);
  }
  return finish("categories", "updated");
}

export async function toggleCategoryAction(formData: FormData): Promise<never> {
  try {
    await setCategoryActive(
      field(formData, "id"),
      activeState(formData),
    );
  } catch (error) {
    reportFailure("categories", error);
  }
  return finish("categories", "status");
}

export async function createUserAction(formData: FormData): Promise<never> {
  try {
    await createUser({
      name: field(formData, "name"),
      email: field(formData, "email"),
      password: field(formData, "password"),
      role: field(formData, "role"),
      sectorId: field(formData, "sectorId") || null,
    });
  } catch (error) {
    reportFailure("users", error);
  }
  return finish("users", "created");
}

export async function updateUserAction(formData: FormData): Promise<never> {
  try {
    await updateUser(field(formData, "id"), {
      name: field(formData, "name"),
      email: field(formData, "email"),
      password: field(formData, "password") || undefined,
      role: field(formData, "role"),
      sectorId: field(formData, "sectorId") || null,
    });
  } catch (error) {
    reportFailure("users", error);
  }
  return finish("users", "updated");
}

export async function toggleUserAction(formData: FormData): Promise<never> {
  try {
    await setUserActive(
      field(formData, "id"),
      activeState(formData),
    );
  } catch (error) {
    reportFailure("users", error);
  }
  return finish("users", "status");
}

export async function createServiceAction(formData: FormData): Promise<never> {
  try {
    await createService({
      name: field(formData, "name"),
      description: field(formData, "description"),
      categoryId: field(formData, "categoryId"),
      sectorId: field(formData, "sectorId"),
    });
  } catch (error) {
    reportFailure("services", error);
  }
  return finish("services", "created");
}

export async function updateServiceAction(formData: FormData): Promise<never> {
  try {
    await updateService(field(formData, "id"), {
      name: field(formData, "name"),
      description: field(formData, "description"),
      categoryId: field(formData, "categoryId"),
      sectorId: field(formData, "sectorId"),
    });
  } catch (error) {
    reportFailure("services", error);
  }
  return finish("services", "updated");
}

export async function toggleServiceAction(formData: FormData): Promise<never> {
  try {
    await setServiceActive(
      field(formData, "id"),
      activeState(formData),
    );
  } catch (error) {
    reportFailure("services", error);
  }
  return finish("services", "status");
}
