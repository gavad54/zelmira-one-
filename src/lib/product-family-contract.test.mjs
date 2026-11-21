import test from "node:test";
import assert from "node:assert/strict";
import { ALL_PRODUCTS, INDEPENDENT_PRODUCTS, VAYRO_CAPABILITIES, VAYRO_PRODUCTS } from "./product-directory.mjs";
import { assertProductFamilyContract } from "./product-family-contract.mjs";

test("VAYRO keeps the approved eleven products and DANA as a platform capability", () => {
  assert.equal(assertProductFamilyContract({ VAYRO_PRODUCTS, INDEPENDENT_PRODUCTS, VAYRO_CAPABILITIES }), true);
  assert.equal(ALL_PRODUCTS.length, 11);
  assert.equal(VAYRO_CAPABILITIES.some(({ name }) => name === "DANA"), true);
  assert.equal(ALL_PRODUCTS.some(({ name }) => name === "DANA"), false);
});

test("ARIA and ARIANA retain separate domain ownership", () => {
  const aria = INDEPENDENT_PRODUCTS.find(({ name }) => name === "ARIA");
  const ariana = INDEPENDENT_PRODUCTS.find(({ name }) => name === "ARIANA");
  assert.match(aria.detail, /بدون حسابداری و ERP/);
  assert.match(ariana.detail, /حسابداری/);
});

test("product-family contract rejects duplicate and missing product identities", () => {
  assert.throws(() => assertProductFamilyContract({
    VAYRO_PRODUCTS: [...VAYRO_PRODUCTS, VAYRO_PRODUCTS[0]],
    INDEPENDENT_PRODUCTS,
    VAYRO_CAPABILITIES
  }), /PRODUCT_IDENTITY_DUPLICATE/);
  assert.throws(() => assertProductFamilyContract({
    VAYRO_PRODUCTS: VAYRO_PRODUCTS.slice(1),
    INDEPENDENT_PRODUCTS,
    VAYRO_CAPABILITIES
  }), /PRODUCT_FAMILY_INCOMPLETE/);
});

test("product-family contract requires DANA exactly once as a platform capability", () => {
  assert.throws(() => assertProductFamilyContract({
    VAYRO_PRODUCTS,
    INDEPENDENT_PRODUCTS,
    VAYRO_CAPABILITIES: []
  }), /DANA_PLATFORM_CAPABILITY_REQUIRED/);
  assert.throws(() => assertProductFamilyContract({
    VAYRO_PRODUCTS,
    INDEPENDENT_PRODUCTS,
    VAYRO_CAPABILITIES: [...VAYRO_CAPABILITIES, VAYRO_CAPABILITIES[0]]
  }), /PLATFORM_CAPABILITY_DUPLICATE/);
  assert.throws(() => assertProductFamilyContract({
    VAYRO_PRODUCTS,
    INDEPENDENT_PRODUCTS,
    VAYRO_CAPABILITIES: [...VAYRO_CAPABILITIES, { name: "ANOTHER_APP" }]
  }), /DANA_PLATFORM_CAPABILITY_REQUIRED/);
});
