import test from "node:test";
import assert from "node:assert/strict";
import { PRODUCT_CATALOG, validateProductConfiguration } from "../src/lib/product-catalog.mjs";

test("the catalog preserves the approved VAYRO product family and independent products", () => {
  assert.deepEqual(PRODUCT_CATALOG.map(product => product.key), [
    "ARVAND", "CHARSU", "GANJINEH", "NEGAH", "SEPEHR", "NAMA", "PAYAM", "DANA", "ARIA", "ARIANA", "LEADORA"
  ]);
  assert.equal(new Set(PRODUCT_CATALOG.map(product => product.key)).size, 11);
  assert.ok(PRODUCT_CATALOG.every(product => product.name && product.description));
  assert.match(PRODUCT_CATALOG.find(product => product.key === "ARIA").description, /بدون حسابداری و ERP/);
  assert.match(PRODUCT_CATALOG.find(product => product.key === "ARIANA").description, /حسابداری/);
});

test("a product cannot be marked active without a secure HTTPS destination", () => {
  assert.deepEqual(validateProductConfiguration({ status: "ACTIVE", baseUrl: null }), { valid: false, error: "active_product_requires_url" });
  assert.deepEqual(validateProductConfiguration({ status: "ACTIVE", baseUrl: "http://example.com" }), { valid: false, error: "https_url_required" });
});

test("product destinations reject embedded credentials and accept HTTPS URLs", () => {
  assert.equal(validateProductConfiguration({ status: "PLANNED", baseUrl: "https://user:pass@example.com" }).valid, false);
  assert.deepEqual(validateProductConfiguration({ status: "ACTIVE", baseUrl: "https://product.example.com" }), { valid: true });
});

test("planned products may remain unconfigured and unknown states are rejected", () => {
  assert.deepEqual(validateProductConfiguration({ status: "PLANNED", baseUrl: null }), { valid: true });
  assert.deepEqual(validateProductConfiguration({ status: "UNKNOWN", baseUrl: null }), { valid: false, error: "invalid_status" });
});
