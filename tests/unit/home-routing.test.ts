import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
}));
const navigation = vi.hoisted(() => ({
  redirect: vi.fn((path: string): never => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("@/server/auth", () => auth);
vi.mock("next/navigation", () => navigation);

import HomePage from "@/app/page";

describe("home page role routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    [null, "/login"],
    [
      {
        id: "admin-id",
        name: "Admin",
        email: "admin@example.test",
        role: "ADMIN",
        sectorId: null,
        isActive: true,
      },
      "/admin",
    ],
    [
      {
        id: "requester-id",
        name: "Requester",
        email: "requester@example.test",
        role: "REQUESTER",
        sectorId: null,
        isActive: true,
      },
      "/catalog",
    ],
    [
      {
        id: "attendant-id",
        name: "Attendant",
        email: "attendant@example.test",
        role: "ATTENDANT",
        sectorId: "sector-id",
        isActive: true,
      },
      "/queue",
    ],
  ] as const)("routes the current database-backed session to %s", async (user, path) => {
    auth.getCurrentUser.mockResolvedValue(user);

    await expect(HomePage()).rejects.toThrow(`REDIRECT:${path}`);
  });
});
