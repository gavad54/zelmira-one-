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
  name: "LEADORA" | "ARIANA" | "ARIA";
  detail: string;
  status: string;
  statusClass: "blocked";
}

export const VAYRO_PRODUCTS: readonly VayroProduct[];
export const INDEPENDENT_PRODUCTS: readonly IndependentProduct[];
export const ALL_PRODUCTS: readonly (VayroProduct | IndependentProduct)[];
