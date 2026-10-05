import { vi, describe, expect, it } from "vitest";
import { prisma } from "./fixtures";
import { ConflictError, NotFoundError, ValidationError } from "@/server/errors";

vi.mock("@/server/authorization", () => ({
  requireConfigurationAdministrator: vi.fn().mockResolvedValue({
    id: "admin-from-server-session",
    role: "ADMIN",
    sectorId: null,
    isActive: true,
  }),
}));

import {
  createCategory,
  listCategories,
  setCategoryActive,
  updateCategory,
} from "@/modules/categories";

async function createService(categoryId: string) {
  const sector = await prisma.sector.create({ data: { name: "Category service sector" } });
  return prisma.service.create({
    data: {
      name: "Category dependency service",
      description: "Active service preventing category deactivation",
      categoryId,
      sectorId: sector.id,
    },
  });
}

describe("category administration", () => {
  it("creates, lists, and edits trimmed category names", async () => {
    const created = await createCategory({ name: "  General " }, prisma);

    expect(created.name).toBe("General");
    await expect(listCategories(prisma)).resolves.toContainEqual(
      expect.objectContaining({ id: created.id, name: "General" }),
    );
    await expect(
      updateCategory(created.id, { name: "  Operations " }, prisma),
    ).resolves.toMatchObject({ name: "Operations" });
  });

  it("validates names and enforces case-insensitive uniqueness among active categories", async () => {
    const existing = await createCategory({ name: "Operations" }, prisma);
    await expect(
      createCategory({ name: "  " }, prisma),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      createCategory({ name: "OPERATIONS" }, prisma),
    ).rejects.toBeInstanceOf(ConflictError);

    await setCategoryActive(existing.id, false, prisma);
    const reusedName = await createCategory({ name: "OPERATIONS" }, prisma);
    expect(reusedName.isActive).toBe(true);
    await expect(
      setCategoryActive(existing.id, true, prisma),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("blocks deactivation while an active service uses the category", async () => {
    const category = await createCategory({ name: "Category with service" }, prisma);
    const service = await createService(category.id);

    await expect(
      setCategoryActive(category.id, false, prisma),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      prisma.category.findUniqueOrThrow({ where: { id: category.id } }),
    ).resolves.toMatchObject({ isActive: true });

    await prisma.service.update({
      where: { id: service.id },
      data: { isActive: false },
    });
    await expect(setCategoryActive(category.id, false, prisma)).resolves.toMatchObject({
      isActive: false,
    });
  });

  it("reactivates the category without deleting historical references", async () => {
    const category = await createCategory({ name: "Category lifecycle" }, prisma);
    await setCategoryActive(category.id, false, prisma);
    await setCategoryActive(category.id, true, prisma);

    await expect(
      prisma.category.count({ where: { id: category.id } }),
    ).resolves.toBe(1);
    await expect(
      updateCategory("00000000-0000-4000-8000-000000000002", { name: "Missing" }, prisma),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
