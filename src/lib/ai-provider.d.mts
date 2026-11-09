export type AIJsonValue = string | number | boolean | null | AIJsonValue[] | { [key: string]: AIJsonValue };

export interface TextGenerationInput {
  prompt: string;
  model?: string;
}
export interface TextGenerationResult {
  text: string;
  model: string;
  usage: AIJsonValue | null;
}
export interface ImageGenerationInput {
  prompt: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024";
}
export interface ImageGenerationResult {
  imageUrl: string;
  model: string;
  revisedPrompt: string | null;
}
export function generateText(
  input: TextGenerationInput,
  env?: Record<string, string | undefined>,
  fetchImpl?: typeof fetch
): Promise<TextGenerationResult>;
export function generateImage(
  input: ImageGenerationInput,
  env?: Record<string, string | undefined>,
  fetchImpl?: typeof fetch
): Promise<ImageGenerationResult>;
