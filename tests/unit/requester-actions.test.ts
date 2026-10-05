import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, ValidationError } from "@/server/errors";

const requests = vi.hoisted(() => ({
  createRequest: vi.fn(),
}));
const nextNavigation = vi.hoisted(() => ({
  redirect: vi.fn((path: string): never => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
const nextCache = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/modules/requests", () => requests);
vi.mock("next/navigation", () => nextNavigation);
vi.mock("next/cache", () => nextCache);

import { createRequestAction } from "@/app/(requester)/requests/actions";

function formData(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("requester Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requests.createRequest.mockResolvedValue({ id: "request-id" });
  });

  it("passes only service and description to the protected domain operation", async () => {
    const data = formData({
      serviceId: "service-id",
      description: "Please help",
      requesterId: "forged-user",
      status: "COMPLETED",
      completedAt: "forged-date",
    });

    await expect(
      createRequestAction(data),
    ).rejects.toThrow("REDIRECT:/requests/request-id?notice=created");

    expect(requests.createRequest).toHaveBeenCalledWith({
      serviceId: "service-id",
      description: "Please help",
    });
    expect(nextCache.revalidatePath).toHaveBeenCalledWith("/catalog");
    expect(nextCache.revalidatePath).toHaveBeenCalledWith("/requests");
  });

  it("maps known errors to safe form feedback and rethrows unexpected failures", async () => {
    requests.createRequest.mockRejectedValueOnce(new ValidationError([]));
    await expect(
      createRequestAction(formData({ serviceId: "service-id", description: "" })),
    ).rejects.toThrow("REDIRECT:/catalog/service-id?error=validation");

    requests.createRequest.mockRejectedValueOnce(new ConflictError());
    await expect(
      createRequestAction(
        formData({ serviceId: "service-id", description: "Please help" }),
      ),
    ).rejects.toThrow("REDIRECT:/catalog/service-id?error=unavailable");

    requests.createRequest.mockRejectedValueOnce(
      new Error("sensitive database detail"),
    );
    await expect(
      createRequestAction(
        formData({ serviceId: "service-id", description: "Please help" }),
      ),
    ).rejects.toThrow("sensitive database detail");
    expect(nextNavigation.redirect).not.toHaveBeenCalledWith(
      expect.stringContaining("sensitive database detail"),
    );
  });
});
