import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "./fixtures";
import { AuthorizationError } from "@/server/errors";

const authorization = vi.hoisted(() => ({
  requireConfigurationAdministrator: vi.fn(),
}));
const nextNavigation = vi.hoisted(() => ({
  redirect: vi.fn((path: string): never => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
const nextCache = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/server/authorization", () => authorization);
vi.mock("@/server/db", async () => {
  const { prisma } = await import("./fixtures");
  return { prisma };
});
vi.mock("next/navigation", () => nextNavigation);
vi.mock("next/cache", () => nextCache);

import {
  createSectorAction,
  updateSectorAction,
} from "@/app/(admin)/admin/actions";

function formData(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("administrative Server Action integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authorization.requireConfigurationAdministrator.mockResolvedValue({
      id: "admin-session",
      role: "ADMIN",
      sectorId: null,
      isActive: true,
    });
  });

  it("persists create and update forms through the protected domain operations", async () => {
    await expect(
      createSectorAction(formData({ name: "Action integration sector" })),
    ).rejects.toThrow("REDIRECT:/admin?notice=created&entity=sectors");
    const sector = await prisma.sector.findFirstOrThrow({
      where: { name: "Action integration sector" },
    });

    await expect(
      updateSectorAction(
        formData({ id: sector.id, name: "Updated action integration sector" }),
      ),
    ).rejects.toThrow("REDIRECT:/admin?notice=updated&entity=sectors");
    await expect(
      prisma.sector.findUniqueOrThrow({ where: { id: sector.id } }),
    ).resolves.toMatchObject({ name: "Updated action integration sector" });
    expect(nextCache.revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("does not persist an action when the administrator check denies access", async () => {
    authorization.requireConfigurationAdministrator.mockRejectedValue(
      new AuthorizationError(),
    );

    await expect(
      createSectorAction(formData({ name: "Denied action sector" })),
    ).rejects.toThrow("REDIRECT:/admin?error=access&entity=sectors");
    await expect(
      prisma.sector.count({ where: { name: "Denied action sector" } }),
    ).resolves.toBe(0);
  });
});
