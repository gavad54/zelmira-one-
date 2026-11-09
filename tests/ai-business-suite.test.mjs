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

test("product and engine filters return only matching capabilities", () => {
  assert.ok(listAiBusinessCapabilities({ product: "NEGAH" }).length > 0);
  assert.ok(listAiBusinessCapabilities({ product: "NEGAH" }).every(x => x.product === "NEGAH"));
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
  const badProduct = AI_BUSINESS_CAPABILITIES.map((x,i) => i === 0 ? {...x, product:"OTHER"} : x);
  assert.equal(validateAiBusinessCapabilityRegistry(badProduct).valid, false);
  const badEngine = AI_BUSINESS_CAPABILITIES.map((x,i) => i === 0 ? {...x, engine:"magic"} : x);
  assert.equal(validateAiBusinessCapabilityRegistry(badEngine).valid, false);
});
