export type BusinessPromptInput = {
  business: string;
  goal: string;
  audience: string;
  tone: string;
  context?: string;
  constraints?: string;
  outputFormat: string;
};
export function buildBusinessPrompt(input: BusinessPromptInput): string;
export function validateBusinessPromptInput(input: unknown): { valid: boolean; error?: string };
