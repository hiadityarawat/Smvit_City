import type { UserRole } from "@prisma/client";

export interface AccessClaims {
  sub: string;
  username: string;
  role: UserRole;
  type: "access";
}

export interface RequestContext {
  ipAddress: string | null;
  userAgent: string | null;
}
