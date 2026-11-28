export interface VayroProduct {
  name: "DANA" | "ARIANA" | "LEADORA" | "ARMIN MARKET" | "ARIA";
  fa: string;
  detail: string;
  tag: string;
  status: string;
  statusClass: "blocked";
  href?: string;
}

export interface AriaModule {
  name: "ARVAND" | "CHARSU" | "GANJINEH" | "NEGAH" | "SEPEHR" | "NAMA" | "PAYAM";
  fa: string;
  detail: string;
  ownerProduct: "ARIA";
  legacyKey: string;
}

export const VAYRO_PRODUCTS: readonly VayroProduct[];
export const ARIA_MODULES: readonly AriaModule[];
/** @deprecated Use VAYRO_PRODUCTS; the alias now refers to the five direct VAYRO sub-apps. */
export const INDEPENDENT_PRODUCTS: readonly VayroProduct[];
export const VAYRO_CAPABILITIES: readonly never[];
export const ALL_PRODUCTS: readonly VayroProduct[];
export const ALL_PRODUCT_MODULES: readonly (VayroProduct | AriaModule)[];
