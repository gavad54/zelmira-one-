import { createHash } from "node:crypto";

export const MAX_CONVERSATION_MESSAGE_CHARS = 24_000;
export const MAX_CONVERSATION_PAGE_SIZE = 50;

function fail(code) {
  throw new Error(code);
}

export function normalizeConversationTitle(value) {
  if (value == null) return null;
  if (typeof value !== "string") fail("CONVERSATION_TITLE_INVALID");
  const title = value.trim();
  if (title.length === 0) return null;
  if (title.length > 200) fail("CONVERSATION_TITLE_TOO_LONG");
  return title;
}

export function validateConversationMessage(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("CONVERSATION_MESSAGE_INVALID");
  if (typeof input.content !== "string") fail("CONVERSATION_MESSAGE_CONTENT_INVALID");
  const content = input.content.trim();
  if (content.length === 0 || content.length > MAX_CONVERSATION_MESSAGE_CHARS) {
    fail("CONVERSATION_MESSAGE_CONTENT_INVALID");
  }
  if (!["USER", "ASSISTANT", "SYSTEM", "TOOL"].includes(input.role)) {
    fail("CONVERSATION_MESSAGE_ROLE_INVALID");
  }
  if (input.role === "USER" && (typeof input.senderUserId !== "string" || input.senderUserId.length < 1)) {
    fail("CONVERSATION_MESSAGE_SENDER_REQUIRED");
  }
  if (input.role !== "USER" && input.senderUserId != null) {
    fail("CONVERSATION_MESSAGE_SENDER_FORBIDDEN");
  }
  return Object.freeze({
    role: input.role,
    content,
    senderUserId: input.senderUserId ?? null,
    contentSha256: createHash("sha256").update(content, "utf8").digest("hex")
  });
}

/** Cursor is an opaque pagination boundary, not an authorization credential. */
export function encodeConversationCursor({ createdAt, id }) {
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (!Number.isFinite(date.getTime()) || typeof id !== "string" || id.length < 1 || id.length > 128) {
    fail("CONVERSATION_CURSOR_INVALID");
  }
  return Buffer.from(JSON.stringify({ createdAt: date.toISOString(), id }), "utf8").toString("base64url");
}

export function decodeConversationCursor(value) {
  if (typeof value !== "string" || value.length < 8 || value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    fail("CONVERSATION_CURSOR_INVALID");
  }
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    fail("CONVERSATION_CURSOR_INVALID");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
      Object.keys(parsed).sort().join(",") !== "createdAt,id" ||
      typeof parsed.createdAt !== "string" || typeof parsed.id !== "string" ||
      parsed.id.length < 1 || parsed.id.length > 128) {
    fail("CONVERSATION_CURSOR_INVALID");
  }
  const createdAt = new Date(parsed.createdAt);
  if (!Number.isFinite(createdAt.getTime()) || createdAt.toISOString() !== parsed.createdAt) {
    fail("CONVERSATION_CURSOR_INVALID");
  }
  return Object.freeze({ createdAt, id: parsed.id });
}

export function normalizeConversationPageSize(value) {
  if (value == null) return 25;
  const size = typeof value === "string" && /^\d{1,3}$/.test(value) ? Number(value) : value;
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_CONVERSATION_PAGE_SIZE) {
    fail("CONVERSATION_PAGE_SIZE_INVALID");
  }
  return size;
}

export function archiveConversationUpdate(now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) fail("CONVERSATION_CLOCK_INVALID");
  return Object.freeze({ archivedAt: new Date(now.getTime()), updatedAt: new Date(now.getTime()) });
}

export function restoreConversationUpdate(now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) fail("CONVERSATION_CLOCK_INVALID");
  return Object.freeze({ archivedAt: null, updatedAt: new Date(now.getTime()) });
}

export function softDeleteConversationUpdate(now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) fail("CONVERSATION_CLOCK_INVALID");
  return Object.freeze({ deletedAt: new Date(now.getTime()), updatedAt: new Date(now.getTime()) });
}
