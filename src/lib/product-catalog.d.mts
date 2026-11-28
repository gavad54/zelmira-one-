export type ProductCatalogEntry = Readonly<{
  key: string;
  name: string;
  description: string;
}>;

export const VAYRO_SUBAPP_CATALOG: readonly ProductCatalogEntry[];
export const ARIA_MODULE_CATALOG: readonly ProductCatalogEntry[];
/** @deprecated Legacy alias for ARIA_MODULE_CATALOG. */
export const PRODUCT_FAMILY_CATALOG: readonly ProductCatalogEntry[];
/** @deprecated Legacy alias for VAYRO_SUBAPP_CATALOG. */
export const INDEPENDENT_PRODUCT_CATALOG: readonly ProductCatalogEntry[];
export const VAYRO_CAPABILITIES: readonly never[];
export const PRODUCT_CATALOG: readonly ProductCatalogEntry[];

export type ProductConfigurationResult =
  | { valid: true }
  | { valid: false; error: string };

export function validateProductConfiguration(input: {
  status: string;
  baseUrl?: string | null;
}): ProductConfigurationResult;
