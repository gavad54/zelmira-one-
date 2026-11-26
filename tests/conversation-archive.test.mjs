import test from "node:test";
import assert from "node:assert/strict";
import {
  archiveConversationUpdate,
  decodeConversationCursor,
  encodeConversationCursor,
  normalizeConversationPageSize,
  normalizeConversationTitle,
  restoreConversationUpdate,
  softDeleteConversationUpdate,
  validateConversationMessage
} from "../src/lib/conversation-archive.mjs";

test("message validation trims content and binds a stable SHA-256 digest", () => {
  const message = validateConversationMessage({ role: "USER", senderUserId: "user_1", content: "  سلام  " });
  assert.equal(message.content, "سلام");
  assert.equal(message.senderUserId, "user_1");
  assert.match(message.contentSha256, /^[a-f0-9]{64}$/);
});

test("message validation rejects role spoofing and empty/oversized content", () => {
  assert.throws(() => validateConversationMessage({ role: "USER", content: "hello" }), /SENDER_REQUIRED/);
  assert.throws(() => validateConversationMessage({ role: "ASSISTANT", senderUserId: "user_1", content: "hello" }), /SENDER_FORBIDDEN/);
  assert.throws(() => validateConversationMessage({ role: "USER", senderUserId: "u", content: " " }), /CONTENT_INVALID/);
  assert.throws(() => validateConversationMessage({ role: "ROOT", content: "hello" }), /ROLE_INVALID/);
});

test("conversation cursor round-trips a stable timestamp/id boundary", () => {
  const createdAt = new Date("2026-11-26T08:30:00.000Z");
  const cursor = encodeConversationCursor({ createdAt, id: "msg_123" });
  const decoded = decodeConversationCursor(cursor);
  assert.equal(decoded.createdAt.toISOString(), createdAt.toISOString());
  assert.equal(decoded.id, "msg_123");
});

test("conversation cursor rejects malformed and non-canonical payloads", () => {
  assert.throws(() => decodeConversationCursor("not-a-cursor"), /CURSOR_INVALID/);
  const invalid = Buffer.from(JSON.stringify({ createdAt: "yesterday", id: "x" })).toString("base64url");
  assert.throws(() => decodeConversationCursor(invalid), /CURSOR_INVALID/);
});

test("page size is bounded and defaults to 25", () => {
  assert.equal(normalizeConversationPageSize(undefined), 25);
  assert.equal(normalizeConversationPageSize("50"), 50);
  assert.throws(() => normalizeConversationPageSize(51), /PAGE_SIZE_INVALID/);
  assert.throws(() => normalizeConversationPageSize("1e3"), /PAGE_SIZE_INVALID/);
});

test("archive, restore and delete are explicit reversible/soft state transitions", () => {
  const now = new Date("2026-11-26T08:30:00.000Z");
  assert.equal(archiveConversationUpdate(now).archivedAt.toISOString(), now.toISOString());
  assert.equal(restoreConversationUpdate(now).archivedAt, null);
  assert.equal(softDeleteConversationUpdate(now).deletedAt.toISOString(), now.toISOString());
});

test("conversation title is normalized and bounded", () => {
  assert.equal(normalizeConversationTitle("  گزارش  "), "گزارش");
  assert.equal(normalizeConversationTitle("  "), null);
  assert.throws(() => normalizeConversationTitle("x".repeat(201)), /TITLE_TOO_LONG/);
});
