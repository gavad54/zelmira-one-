import type { Prisma } from "@prisma/client";

export type TenantTransaction = Prisma.TransactionClient;

export type TenantTransactionActor = {
  userId: string;
  tenantId: string;
  role: string;
};

export type AuthenticatedTransactionActor = {
  userId: string;
  tenantId: string;
};

export type TenantTransactionResult<T = unknown> =
  | { authorized: false }
  | {
      authorized: true;
      userId: string;
      tenantId: string;
      role: string;
      value: T;
    };

export type AuthenticatedTransactionResult<T = unknown> =
  | { authorized: false }
  | { authorized: true; userId: string; value: T };

export function withTenantRequestTransaction<T = unknown>(input: {
  authDb: unknown;
  tenantDb: unknown;
  sessionToken?: string | null;
  tenantId: string;
  action: string;
  callback: (tx: TenantTransaction, actor: TenantTransactionActor) => Promise<T> | T;
  now?: Date;
}): Promise<TenantTransactionResult<T>>;

export function withAuthenticatedUserTransaction<T = unknown>(input: {
  authDb: unknown;
  tenantDb: unknown;
  sessionToken?: string | null;
  tenantId?: string;
  callback: (tx: TenantTransaction, actor: AuthenticatedTransactionActor) => Promise<T> | T;
  now?: Date;
}): Promise<AuthenticatedTransactionResult<T>>;
