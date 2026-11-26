import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_CONVERSATION_EXPORT_BYTES,
  MAX_CONVERSATION_EXPORT_MESSAGES,
  serializeConversationExport
} from "../src/lib/conversation-export.mjs";

const conversation = { id: "conv_1", title: "Test conversation" };

test("conversation export is versioned and preserves message and attachment metadata", () => {
  const body = serializeConversationExport({
    conversation,
    messages: [{ id: "msg_1", content: "hello", attachments: [{ id: "file_1", sha256: "a".repeat(64) }] }],
    exportedAt: new Date("2026-11-26T00:00:00.000Z")
  });
  const parsed = JSON.parse(body);
  assert.equal(parsed.format, "vayro.conversation-export.v1");
  assert.equal(parsed.conversation.id, "conv_1");
  assert.equal(parsed.messages[0].attachments[0].id, "file_1");
  assert.equal(parsed.exportedAt, "2026-11-26T00:00:00.000Z");
});

test("conversation export rejects more than the bounded message count", () => {
  assert.throws(() => serializeConversationExport({
    conversation,
    messages: Array.from({ length: MAX_CONVERSATION_EXPORT_MESSAGES + 1 }, () => ({}))
  }), /CONVERSATION_EXPORT_TOO_LARGE/);
});

test("conversation export rejects oversized serialized payloads", () => {
  assert.throws(() => serializeConversationExport({
    conversation,
    messages: [{ content: "x".repeat(MAX_CONVERSATION_EXPORT_BYTES) }]
  }), /CONVERSATION_EXPORT_TOO_LARGE/);
});

test("conversation export rejects invalid clocks and malformed inputs", () => {
  assert.throws(() => serializeConversationExport({ conversation, messages: [], exportedAt: "yesterday" }), /CONVERSATION_EXPORT_CLOCK_INVALID/);
  assert.throws(() => serializeConversationExport({ conversation: null, messages: [] }), /CONVERSATION_EXPORT_INVALID/);
  assert.throws(() => serializeConversationExport({ conversation, messages: {} }), /CONVERSATION_EXPORT_MESSAGES_INVALID/);
});
