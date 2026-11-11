export type TenantRequestAuthorizationResult =
  | { authorized: true; userId: string; tenantId: string; role: string }
  | { authorized: false };

type SessionLookup = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  lastSeenAt: Date | null;
  assurance: string;
  mfaAuthenticatedAt: Date | null;
  user: {
    id: string;
    emailVerifiedAt: Date | null;
    disabledAt: Date | null;
  };
} | null;

type MembershipLookup = {
  userId: string;
  tenantId: string;
  role: string;
  tenant: { id: string; status: string };
} | null;

type SessionUpdateManyArgs = {
  where: {
    id: string;
    revokedAt: null;
    expiresAt?: { gt: Date };
  };
  data: {
    revokedAt?: Date;
    lastSeenAt?: Date;
  };
};

export function authorizeTenantRequest(input: {
  sessionToken?: string | null;
  tenantId: string;
  action: string;
  db: {
    session: {
      findUnique(args: {
        where: { tokenHash: string };
        include: {
          user: {
            select: {
              id: true;
              emailVerifiedAt: true;
              disabledAt: true;
            };
          };
        };
      }): Promise<SessionLookup>;
      updateMany(args: SessionUpdateManyArgs): Promise<{ count: number }>;
    };
    membership: {
      findUnique(args: {
        where: { userId_tenantId: { userId: string; tenantId: string } };
        include: { tenant: { select: { id: true; status: true } } };
      }): Promise<MembershipLookup>;
    };
  };
  now?: Date;
}): Promise<TenantRequestAuthorizationResult>;
