export type AiBusinessCapability = {
  number: number;
  key: string;
  title: string;
  product: "ARVAND" | "CHARSU" | "GANJINEH" | "NEGAH" | "SEPEHR" | "NAMA" | "PAYAM" | "DANA";
  engine: string;
  revenue: string;
  availability: "PLANNED";
};
export const AI_BUSINESS_CAPABILITIES: readonly AiBusinessCapability[];
export const AI_ENGINE_KEYS: readonly string[];
export function listAiBusinessCapabilities(options?: {
  product?: string;
  engine?: string;
  includePlanned?: boolean;
}): AiBusinessCapability[];
export function validateAiBusinessCapabilityRegistry(items?: readonly AiBusinessCapability[]): { valid: boolean; error?: string };
