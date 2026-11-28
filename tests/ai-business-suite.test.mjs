import test from "node:test";
import assert from "node:assert/strict";
import {
  AI_BUSINESS_CAPABILITIES,
  listAiBusinessCapabilities,
  validateAiBusinessCapabilityRegistry
} from "../src/lib/ai-business-suite.mjs";

test("registry contains exactly 50 unique numbered capabilities", () => {
  assert.deepEqual(validateAiBusinessCapabilityRegistry(), { valid: true });
  assert.equal(AI_BUSINESS_CAPABILITIES.length, 50);
  assert.deepEqual(AI_BUSINESS_CAPABILITIES.map(x => x.number), Array.from({length:50}, (_,i) => i+1));
  assert.equal(new Set(AI_BUSINESS_CAPABILITIES.map(x => x.key)).size, 50);
});

test("all legacy capabilities are canonically owned by ARIA while preserving their old module keys", () => {
  const legacy = AI_BUSINESS_CAPABILITIES.filter(item => item.product !== "DANA");
  assert.ok(legacy.length > 0);
  assert.ok(legacy.every(item => item.ownerProduct === "ARIA"));
  assert.ok(legacy.every(item => item.moduleKey === item.product));
  assert.ok(legacy.every(item => item.legacyProduct === item.product));
  assert.equal(listAiBusinessCapabilities({ product: "ARIA" }).length, legacy.length);
});

test("DANA capabilities belong to the independent DANA sub-application", () => {
  const dana = AI_BUSINESS_CAPABILITIES.filter(item => item.product === "DANA");
  assert.ok(dana.length > 0);
  assert.ok(dana.every(item => item.ownerProduct === "DANA"));
  assert.ok(dana.every(item => item.moduleKey === "DANA"));
  assert.equal(listAiBusinessCapabilities({ product: "DANA" }).length, dana.length);
});

test("legacy product filters remain backward-compatible", () => {
  const negah = listAiBusinessCapabilities({ product: "NEGAH" });
  assert.ok(negah.length > 0);
  assert.ok(negah.every(item => item.product === "NEGAH" && item.ownerProduct === "ARIA"));
  assert.ok(listAiBusinessCapabilities({ product: "ARVAND" }).every(item => item.moduleKey === "ARVAND"));
});

test("product and engine filters return only matching capabilities", () => {
  assert.ok(listAiBusinessCapabilities({ product: "ARIA" }).every(x => x.ownerProduct === "ARIA"));
  assert.ok(listAiBusinessCapabilities({ engine: "document" }).every(x => x.engine === "document"));
  assert.deepEqual(listAiBusinessCapabilities({ product: "UNKNOWN" }), []);
});

test("planned capabilities are not represented as active integrations", () => {
  assert.ok(AI_BUSINESS_CAPABILITIES.every(x => x.availability === "PLANNED"));
  assert.deepEqual(listAiBusinessCapabilities({ includePlanned: false }), []);
});

test("validator rejects duplicate identifiers, unknown products and unknown engines", () => {
  const duplicate = [...AI_BUSINESS_CAPABILITIES, AI_BUSINESS_CAPABILITIES[0]];
  assert.equal(validateAiBusinessCapabilityRegistry(duplicate).valid, false);
  const badProduct = AI_BUSINESS_CAPABILITIES.map((x,i) => i === 0 ? {...x, ownerProduct:"OTHER"} : x);
  assert.equal(validateAiBusinessCapabilityRegistry(badProduct).valid, false);
  const badEngine = AI_BUSINESS_CAPABILITIES.map((x,i) => i === 0 ? {...x, engine:"magic"} : x);
  assert.equal(validateAiBusinessCapabilityRegistry(badEngine).valid, false);
});
