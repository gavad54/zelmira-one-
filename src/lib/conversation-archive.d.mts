export const MAX_CONVERSATION_MESSAGE_CHARS: 24000;
export const MAX_CONVERSATION_PAGE_SIZE: 50;

export function normalizeConversationTitle(value: unknown): string | null;
export function validateConversationMessage(input: {
  role: "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";
  senderUserId?: string | null;
  content: string;
}): {
  readonly role: "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";
  readonly content: string;
  readonly senderUserId: string | null;
  readonly contentSha256: string;
};
export function encodeConversationCursor(input: { createdAt: Date | string; id: string }): string;
export function decodeConversationCursor(value: string): Readonly<{ createdAt: Date; id: string }>;
export function normalizeConversationPageSize(value: unknown): number;
export function archiveConversationUpdate(now?: Date): Readonly<{ archivedAt: Date; updatedAt: Date }>;
export function restoreConversationUpdate(now?: Date): Readonly<{ archivedAt: null; updatedAt: Date }>;
export function softDeleteConversationUpdate(now?: Date): Readonly<{ deletedAt: Date; updatedAt: Date }>;
