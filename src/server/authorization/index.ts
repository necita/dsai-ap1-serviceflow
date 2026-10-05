import { getCurrentUser } from "@/server/auth";
import { NotFoundError } from "@/server/errors";
import { prisma } from "@/server/db";
import {
  assertActiveActor,
  assertRequestReadable,
  assertRole,
  assertStatusChangeAllowed,
  type AuthorizationActor,
  type RequestAuthorizationScope,
} from "./policy";

export {
  assertActiveActor,
  assertRequestReadable,
  assertRole,
  assertStatusChangeAllowed,
};
export type {
  AuthorizedStatusActor,
  AuthorizationActor,
  RequestAuthorizationScope,
} from "./policy";

export async function requireCurrentActor(): Promise<AuthorizationActor> {
  return assertActiveActor(await getCurrentUser());
}

export async function requireConfigurationAdministrator(): Promise<AuthorizationActor> {
  return assertRole(await requireCurrentActor(), "ADMIN");
}

export async function requirePublishedCatalogReader(): Promise<AuthorizationActor> {
  return assertRole(await requireCurrentActor(), "REQUESTER");
}

export async function requireRequestCreator(): Promise<AuthorizationActor> {
  return assertRole(await requireCurrentActor(), "REQUESTER");
}

export async function requireRequestReader(
  requestId: string,
): Promise<AuthorizationActor> {
  const actor = await requireCurrentActor();
  const request = await loadRequestScope(requestId);
  return assertRequestReadable(actor, request);
}

export async function requireStatusChangeActor(
  requestId: string,
): Promise<{ actorId: string; sectorId: string }> {
  const actor = await requireCurrentActor();
  const request = await loadRequestScope(requestId);
  return assertStatusChangeAllowed(actor, request);
}

async function loadRequestScope(
  requestId: string,
): Promise<RequestAuthorizationScope> {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { requesterId: true, sectorId: true },
  });

  if (!request) {
    throw new NotFoundError();
  }

  return request;
}
