export type ProductCatalogEntry = Readonly<{
  key: string;
  name: string;
  description: string;
}>;

export const PRODUCT_CATALOG: readonly ProductCatalogEntry[];
export const PRODUCT_FAMILY_CATALOG: readonly ProductCatalogEntry[];
/** Backward-compatible alias; it references the same six entries and must not be concatenated. */
export const INDEPENDENT_PRODUCT_CATALOG: readonly ProductCatalogEntry[];
export const ARIA_INTERNAL_DOMAINS: readonly ProductCatalogEntry[];
export const VAYRO_CAPABILITIES: readonly never[];

export type ProductConfigurationResult =
  | { valid: true }
  | { valid: false; error: string };

export function validateProductConfiguration(input: {
  status: string;
  baseUrl?: string | null;
}): ProductConfigurationResult;
