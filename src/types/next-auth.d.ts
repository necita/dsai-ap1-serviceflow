import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user:
      | (DefaultSession["user"] & {
          id: string;
          role: Role;
          sectorId: string | null;
          isActive: boolean;
        })
      | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    sectorId?: string | null;
    isActive?: boolean;
  }
}
