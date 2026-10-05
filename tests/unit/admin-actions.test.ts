import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, ValidationError } from "@/server/errors";

const domain = vi.hoisted(() => ({
  createCategory: vi.fn(),
  createSector: vi.fn(),
  createService: vi.fn(),
  createUser: vi.fn(),
  setCategoryActive: vi.fn(),
  setSectorActive: vi.fn(),
  setServiceActive: vi.fn(),
  setUserActive: vi.fn(),
  updateCategory: vi.fn(),
  updateSector: vi.fn(),
  updateService: vi.fn(),
  updateUser: vi.fn(),
}));
const nextNavigation = vi.hoisted(() => ({
  redirect: vi.fn((path: string): never => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
const nextCache = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/modules/sectors", () => ({
  createSector: domain.createSector,
  setSectorActive: domain.setSectorActive,
  updateSector: domain.updateSector,
}));
vi.mock("@/modules/categories", () => ({
  createCategory: domain.createCategory,
  setCategoryActive: domain.setCategoryActive,
  updateCategory: domain.updateCategory,
}));
vi.mock("@/modules/users", () => ({
  createUser: domain.createUser,
  setUserActive: domain.setUserActive,
  updateUser: domain.updateUser,
}));
vi.mock("@/modules/services", () => ({
  createService: domain.createService,
  setServiceActive: domain.setServiceActive,
  updateService: domain.updateService,
}));
vi.mock("next/navigation", () => nextNavigation);
vi.mock("next/cache", () => nextCache);

import {
  createCategoryAction,
  createSectorAction,
  createServiceAction,
  createUserAction,
  toggleCategoryAction,
  toggleSectorAction,
  toggleServiceAction,
  toggleUserAction,
  updateCategoryAction,
  updateSectorAction,
  updateServiceAction,
  updateUserAction,
} from "@/app/(admin)/admin/actions";

function formData(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

async function expectRedirect(action: Promise<never>, path: string): Promise<void> {
  await expect(action).rejects.toThrow(`REDIRECT:${path}`);
}

describe("administrative Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const operation of Object.values(domain)) operation.mockResolvedValue({});
  });

  it("routes create forms through the protected domain operations", async () => {
    await expectRedirect(
      createSectorAction(formData({ name: "Operations" })),
      "/admin?notice=created&entity=sectors",
    );
    await expectRedirect(
      createCategoryAction(formData({ name: "General" })),
      "/admin?notice=created&entity=categories",
    );
    await expectRedirect(
      createUserAction(
        formData({
          name: "Requester",
          email: "person@example.test",
          password: "secret",
          role: "REQUESTER",
          sectorId: "",
        }),
      ),
      "/admin?notice=created&entity=users",
    );
    await expectRedirect(
      createServiceAction(
        formData({
          name: "Support",
          description: "Service description",
          categoryId: "category-id",
          sectorId: "sector-id",
        }),
      ),
      "/admin?notice=created&entity=services",
    );

    expect(domain.createSector).toHaveBeenCalledWith({ name: "Operations" });
    expect(domain.createCategory).toHaveBeenCalledWith({ name: "General" });
    expect(domain.createUser).toHaveBeenCalledWith({
      name: "Requester",
      email: "person@example.test",
      password: "secret",
      role: "REQUESTER",
      sectorId: null,
    });
    expect(domain.createService).toHaveBeenCalledWith({
      name: "Support",
      description: "Service description",
      categoryId: "category-id",
      sectorId: "sector-id",
    });
    expect(nextCache.revalidatePath).toHaveBeenCalledTimes(4);
  });

  it("routes edit and activation forms to the corresponding domain operations", async () => {
    await expectRedirect(
      updateSectorAction(formData({ id: "sector", name: "New name" })),
      "/admin?notice=updated&entity=sectors",
    );
    await expectRedirect(
      toggleSectorAction(formData({ id: "sector", isActive: "false" })),
      "/admin?notice=status&entity=sectors",
    );
    await expectRedirect(
      updateCategoryAction(formData({ id: "category", name: "New category" })),
      "/admin?notice=updated&entity=categories",
    );
    await expectRedirect(
      toggleCategoryAction(formData({ id: "category", isActive: "true" })),
      "/admin?notice=status&entity=categories",
    );
    await expectRedirect(
      updateUserAction(
        formData({
          id: "user",
          name: "Attendant",
          email: "attendant@example.test",
          password: "",
          role: "ATTENDANT",
          sectorId: "sector",
        }),
      ),
      "/admin?notice=updated&entity=users",
    );
    await expectRedirect(
      toggleUserAction(formData({ id: "user", isActive: "false" })),
      "/admin?notice=status&entity=users",
    );
    await expectRedirect(
      updateServiceAction(
        formData({
          id: "service",
          name: "New service",
          description: "New details",
          categoryId: "category",
          sectorId: "sector",
        }),
      ),
      "/admin?notice=updated&entity=services",
    );
    await expectRedirect(
      toggleServiceAction(formData({ id: "service", isActive: "false" })),
      "/admin?notice=status&entity=services",
    );

    expect(domain.updateSector).toHaveBeenCalledWith("sector", { name: "New name" });
    expect(domain.setSectorActive).toHaveBeenCalledWith("sector", false);
    expect(domain.updateCategory).toHaveBeenCalledWith("category", { name: "New category" });
    expect(domain.setCategoryActive).toHaveBeenCalledWith("category", true);
    expect(domain.updateUser).toHaveBeenCalledWith("user", {
      name: "Attendant",
      email: "attendant@example.test",
      password: undefined,
      role: "ATTENDANT",
      sectorId: "sector",
    });
    expect(domain.setUserActive).toHaveBeenCalledWith("user", false);
    expect(domain.updateService).toHaveBeenCalledWith("service", {
      name: "New service",
      description: "New details",
      categoryId: "category",
      sectorId: "sector",
    });
    expect(domain.setServiceActive).toHaveBeenCalledWith("service", false);
  });

  it("returns safe, understandable form states for validation and dependency errors", async () => {
    domain.createSector.mockRejectedValueOnce(new ValidationError([]));
    await expectRedirect(
      createSectorAction(formData({ name: "" })),
      "/admin?error=validation&entity=sectors",
    );

    domain.setCategoryActive.mockRejectedValueOnce(new ConflictError());
    await expectRedirect(
      toggleCategoryAction(formData({ id: "category", isActive: "false" })),
      "/admin?error=dependency&entity=categories",
    );

    domain.createService.mockRejectedValueOnce(
      new Error("sensitive database details"),
    );
    await expect(
      createServiceAction(
        formData({
          name: "Service",
          description: "Details",
          categoryId: "category",
          sectorId: "sector",
        }),
      ),
    ).rejects.toThrow("sensitive database details");
    expect(nextNavigation.redirect).not.toHaveBeenCalledWith(
      expect.stringContaining("sensitive database details"),
    );
  });
});
