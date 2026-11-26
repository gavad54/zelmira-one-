export const MAX_CONVERSATION_EXPORT_MESSAGES = 5000;
export const MAX_CONVERSATION_EXPORT_BYTES = 10 * 1024 * 1024;

function fail(code) {
  throw new Error(code);
}

export function serializeConversationExport({ conversation, messages, exportedAt = new Date() }) {
  if (!conversation || typeof conversation !== "object" || Array.isArray(conversation)) {
    fail("CONVERSATION_EXPORT_INVALID");
  }
  if (!Array.isArray(messages)) fail("CONVERSATION_EXPORT_MESSAGES_INVALID");
  if (messages.length > MAX_CONVERSATION_EXPORT_MESSAGES) fail("CONVERSATION_EXPORT_TOO_LARGE");
  if (!(exportedAt instanceof Date) || !Number.isFinite(exportedAt.getTime())) {
    fail("CONVERSATION_EXPORT_CLOCK_INVALID");
  }

  const payload = JSON.stringify({
    format: "vayro.conversation-export.v1",
    exportedAt: exportedAt.toISOString(),
    conversation,
    messages
  }, null, 2);

  if (Buffer.byteLength(payload, "utf8") > MAX_CONVERSATION_EXPORT_BYTES) {
    fail("CONVERSATION_EXPORT_TOO_LARGE");
  }
  return payload;
}
