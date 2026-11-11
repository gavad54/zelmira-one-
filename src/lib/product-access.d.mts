export interface ProductLicenseAccessInput {
  productStatus: string;
  active: boolean;
  startsAt: Date | string;
  endsAt: Date | string | null;
}
export type ProductAccessDecision =
  | { allowed: true; reason: "active" }
  | { allowed: false; reason: "no_license" | "invalid_clock" | "product_unavailable" | "license_inactive" | "invalid_license" | "not_started" | "expired" };
export function resolveProductAccess(
  license: ProductLicenseAccessInput | null | undefined,
  now?: Date
): ProductAccessDecision;
