export type OwnerAuthorization =
  | { authorized: true; userId: string }
  | { authorized: false };
export function authorizeOwnerSession(input: {
  sessionToken: string | null | undefined;
  db: unknown;
  now?: Date;
}): Promise<OwnerAuthorization>;
