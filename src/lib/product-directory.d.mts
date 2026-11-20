export interface VayroProduct {
  name: "ARIA" | "ARIANA" | "LEADORA" | "ARMIN MARKET" | "DANA" | "ARVAND";
  fa: string;
  detail: string;
  tag: string;
  status: string;
  statusClass: "blocked";
  href?: string;
}

export type IndependentProduct = VayroProduct;

export interface AriaDomain {
  name: "GANJINEH" | "NEGAH" | "SEPEHR" | "NAMA";
  fa: string;
  detail: string;
  status: string;
  statusClass: "planned" | "prototype";
  href?: string;
}

export interface VayroCapability {
  name: string;
  fa: string;
  detail: string;
  href: string;
  status: string;
}

export const VAYRO_PRODUCTS: readonly VayroProduct[];
export const INDEPENDENT_PRODUCTS: readonly IndependentProduct[];
export const ARIA_DOMAINS: readonly AriaDomain[];
export const VAYRO_CAPABILITIES: readonly VayroCapability[];
export const ALL_PRODUCTS: readonly VayroProduct[];
