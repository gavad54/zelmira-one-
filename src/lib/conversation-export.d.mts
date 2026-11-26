export const MAX_CONVERSATION_EXPORT_MESSAGES: number;
export const MAX_CONVERSATION_EXPORT_BYTES: number;
export function serializeConversationExport(input: {
  conversation: Record<string, unknown>;
  messages: Array<Record<string, unknown>>;
  exportedAt?: Date;
}): string;
