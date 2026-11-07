export type ProductCatalogEntry = Readonly<{
  key: string;
  name: string;
  description: string;
}>;

export const PRODUCT_CATALOG: readonly ProductCatalogEntry[];

export type ProductConfigurationResult =
  | { valid: true }
  | { valid: false; error: string };

export function validateProductConfiguration(input: {
  status: string;
  baseUrl?: string | null;
}): ProductConfigurationResult;
