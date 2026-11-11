export interface VayroProduct {
  name: string;
  fa: string;
  detail: string;
  tag: string;
  status: string;
  statusClass: "planned" | "prototype";
  href?: string;
}

export interface IndependentProduct {
  name: "LEADORA" | "ARIANA" | "ARIA" | "ARMIN MARKET";
  detail: string;
  status: string;
  statusClass: "blocked";
}

export interface VayroCapability {
  name: "DANA";
  fa: string;
  detail: string;
  href: string;
  status: string;
}

export const VAYRO_PRODUCTS: readonly VayroProduct[];
export const INDEPENDENT_PRODUCTS: readonly IndependentProduct[];
export const VAYRO_CAPABILITIES: readonly VayroCapability[];
export const ALL_PRODUCTS: readonly (VayroProduct | IndependentProduct)[];
