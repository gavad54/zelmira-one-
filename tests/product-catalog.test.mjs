import test from "node:test";
import assert from "node:assert/strict";
import {
  PRODUCT_CATALOG,
  PRODUCT_FAMILY_CATALOG,
  INDEPENDENT_PRODUCT_CATALOG,
  ARIA_INTERNAL_DOMAINS,
  VAYRO_CAPABILITIES,
  validateProductConfiguration
} from "../src/lib/product-catalog.mjs";

test("the owner registry contains exactly six independent direct VAYRO products", () => {
  const expected = ["ARIA", "ARIANA", "LEADORA", "ARMIN_MARKET", "DANA", "ARVAND"];
  assert.deepEqual(PRODUCT_FAMILY_CATALOG.map(product => product.key), expected);
  assert.deepEqual(INDEPENDENT_PRODUCT_CATALOG.map(product => product.key), expected);
  assert.deepEqual(PRODUCT_CATALOG.map(product => product.key), expected);
  assert.equal(PRODUCT_CATALOG.length, 6);
  assert.equal(new Set(PRODUCT_CATALOG.map(product => product.key)).size, 6);
  assert.ok(PRODUCT_CATALOG.every(product => product.name && product.description));
  assert.deepEqual(VAYRO_CAPABILITIES, []);
  assert.deepEqual(ARIA_INTERNAL_DOMAINS.map(domain => domain.key), ["GANJINEH", "NEGAH", "SEPEHR", "NAMA"]);
  assert.ok(!PRODUCT_CATALOG.some(product => ["CHARSU", "PAYAM", "GANJINEH", "NEGAH", "SEPEHR", "NAMA"].includes(product.key)));
  assert.match(PRODUCT_CATALOG.find(product => product.key === "ARIA").description, /بدون حسابداری، دفترکل یا ERP/);
  assert.match(PRODUCT_CATALOG.find(product => product.key === "ARIANA").description, /تنها مرجع/);
  assert.match(PRODUCT_CATALOG.find(product => product.key === "DANA").description, /اپلیکیشن مستقل/);
});

test("a product cannot be marked active without a secure HTTPS destination", () => {
  assert.deepEqual(
    validateProductConfiguration({ status: "ACTIVE", baseUrl: null }),
    { valid: false, error: "active_product_requires_url" }
  );
  assert.deepEqual(
    validateProductConfiguration({ status: "ACTIVE", baseUrl: "http://example.com" }),
    { valid: false, error: "https_url_required" }
  );
});

test("product destinations reject embedded credentials and accept HTTPS URLs", () => {
  assert.equal(validateProductConfiguration({ status: "PLANNED", baseUrl: "https://user:pass@example.com" }).valid, false);
  assert.deepEqual(
    validateProductConfiguration({ status: "ACTIVE", baseUrl: "https://product.example.com" }),
    { valid: true }
  );
});

test("planned products may remain unconfigured and unknown states are rejected", () => {
  assert.deepEqual(validateProductConfiguration({ status: "PLANNED", baseUrl: null }), { valid: true });
  assert.deepEqual(validateProductConfiguration({ status: "UNKNOWN", baseUrl: null }), { valid: false, error: "invalid_status" });
});
