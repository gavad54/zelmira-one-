export type TenantRequestAuthorizationResult =
  | { authorized: true; userId: string; tenantId: string; role: string }
  | { authorized: false };

type SessionLookup = {
  expiresAt: Date;
  user: { id: string; disabledAt: Date | null };
} | null;

type MembershipLookup = {
  userId: string;
  tenantId: string;
  role: string;
  tenant: { id: string; status: string };
} | null;

export function authorizeTenantRequest(input: {
  sessionToken?: string | null;
  tenantId: string;
  action: string;
  db: {
    session: {
      findUnique(args: {
        where: { tokenHash: string };
        include: { user: { select: { id: true; disabledAt: true } } };
      }): Promise<SessionLookup>;
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
