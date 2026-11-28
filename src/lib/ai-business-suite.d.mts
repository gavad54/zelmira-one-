export type LegacyAriaModuleKey = "ARVAND" | "CHARSU" | "GANJINEH" | "NEGAH" | "SEPEHR" | "NAMA" | "PAYAM";
export type CanonicalVayroProduct = "DANA" | "ARIANA" | "LEADORA" | "ARMIN_MARKET" | "ARIA";
export type AiBusinessCapability = {
  number: number;
  key: string;
  title: string;
  /** Legacy filter key retained for backward compatibility. */
  product: LegacyAriaModuleKey | "DANA";
  ownerProduct: "ARIA" | "DANA";
  moduleKey: LegacyAriaModuleKey | "DANA";
  legacyProduct: LegacyAriaModuleKey | null;
  engine: string;
  revenue: string;
  availability: "PLANNED";
};
export const AI_BUSINESS_CAPABILITIES: readonly AiBusinessCapability[];
export const AI_ENGINE_KEYS: readonly string[];
export function listAiBusinessCapabilities(options?: {
  product?: CanonicalVayroProduct | LegacyAriaModuleKey;
  module?: LegacyAriaModuleKey;
  engine?: string;
  includePlanned?: boolean;
}): AiBusinessCapability[];
export function validateAiBusinessCapabilityRegistry(items?: readonly AiBusinessCapability[]): { valid: boolean; error?: string };
