import { describe, expect, it } from "vitest";
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from "@/server/errors";
import {
  assertActiveActor,
  assertRequestReadable,
  assertRole,
  assertStatusChangeAllowed,
  type AuthorizationActor,
} from "@/server/authorization/policy";

const admin: AuthorizationActor = {
  id: "admin-1",
  role: "ADMIN",
  sectorId: null,
  isActive: true,
};
const requester: AuthorizationActor = {
  id: "requester-1",
  role: "REQUESTER",
  sectorId: null,
  isActive: true,
};
const attendant: AuthorizationActor = {
  id: "attendant-1",
  role: "ATTENDANT",
  sectorId: "sector-1",
  isActive: true,
};

describe("server authorization policy", () => {
  it("requires an authenticated active actor and the exact role", () => {
    expect(() => assertActiveActor(null)).toThrow(AuthenticationError);
    expect(() =>
      assertActiveActor({ ...requester, isActive: false }),
    ).toThrow(AuthenticationError);
    expect(assertRole(admin, "ADMIN")).toEqual(admin);
    expect(() => assertRole(requester, "ADMIN")).toThrow(AuthorizationError);
  });

  it("allows configuration to administrators and catalog/request creation to requesters only", () => {
    expect(assertRole(admin, "ADMIN")).toEqual(admin);
    expect(assertRole(requester, "REQUESTER")).toEqual(requester);
    expect(() => assertRole(attendant, "ADMIN")).toThrow(AuthorizationError);
    expect(() => assertRole(admin, "REQUESTER")).toThrow(AuthorizationError);
    expect(() => assertRole(attendant, "REQUESTER")).toThrow(AuthorizationError);
  });

  it("allows requesters to read only their own requests and attendants only their sector", () => {
    expect(
      assertRequestReadable(requester, {
        requesterId: requester.id,
        sectorId: "sector-2",
      }),
    ).toEqual(requester);
    expect(
      assertRequestReadable(attendant, {
        requesterId: "someone-else",
        sectorId: attendant.sectorId!,
      }),
    ).toEqual(attendant);
    expect(() =>
      assertRequestReadable(requester, {
        requesterId: "someone-else",
        sectorId: "sector-1",
      }),
    ).toThrow(NotFoundError);
    expect(() =>
      assertRequestReadable(attendant, {
        requesterId: "someone-else",
        sectorId: "sector-2",
      }),
    ).toThrow(NotFoundError);
    expect(() =>
      assertRequestReadable(admin, {
        requesterId: requester.id,
        sectorId: attendant.sectorId!,
      }),
    ).toThrow(NotFoundError);
  });

  it("lets only an active attendant in the request sector change status and returns trusted IDs", () => {
    expect(
      assertStatusChangeAllowed(attendant, {
        requesterId: requester.id,
        sectorId: attendant.sectorId!,
      }),
    ).toEqual({ actorId: attendant.id, sectorId: attendant.sectorId });
    expect(() =>
      assertStatusChangeAllowed(requester, {
        requesterId: requester.id,
        sectorId: attendant.sectorId!,
      }),
    ).toThrow(NotFoundError);
    expect(() =>
      assertStatusChangeAllowed(admin, {
        requesterId: requester.id,
        sectorId: attendant.sectorId!,
      }),
    ).toThrow(NotFoundError);
    expect(() =>
      assertStatusChangeAllowed(
        { ...attendant, sectorId: null },
        { requesterId: requester.id, sectorId: "sector-1" },
      ),
    ).toThrow(NotFoundError);
  });
});
