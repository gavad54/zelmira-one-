import test from "node:test";
import assert from "node:assert/strict";
import { ALL_PRODUCTS, ARIA_MODULES, INDEPENDENT_PRODUCTS, VAYRO_CAPABILITIES, VAYRO_PRODUCTS } from "./product-directory.mjs";
import { assertProductFamilyContract } from "./product-family-contract.mjs";

test("VAYRO has exactly five direct sub-apps and seven preserved ARIA modules", () => {
  assert.equal(assertProductFamilyContract({ VAYRO_PRODUCTS, ARIA_MODULES, VAYRO_CAPABILITIES }), true);
  assert.equal(ALL_PRODUCTS.length, 5);
  assert.deepEqual(ALL_PRODUCTS.map(({ name }) => name), [
    "DANA", "ARIANA", "LEADORA", "ARMIN MARKET", "ARIA"
  ]);
  assert.deepEqual(ARIA_MODULES.map(({ name }) => name), [
    "ARVAND", "CHARSU", "GANJINEH", "NEGAH", "SEPEHR", "NAMA", "PAYAM"
  ]);
  assert.deepEqual(INDEPENDENT_PRODUCTS, VAYRO_PRODUCTS);
  assert.equal(VAYRO_CAPABILITIES.length, 0);
});

test("ARIA and ARIANA retain separate domain ownership", () => {
  const aria = VAYRO_PRODUCTS.find(({ name }) => name === "ARIA");
  const ariana = VAYRO_PRODUCTS.find(({ name }) => name === "ARIANA");
  assert.match(aria.detail, /بدون حسابداری و ERP/);
  assert.match(ariana.detail, /حسابداری/);
});

test("product-family contract rejects duplicate and missing sub-app identities", () => {
  assert.throws(() => assertProductFamilyContract({
    VAYRO_PRODUCTS: [...VAYRO_PRODUCTS, VAYRO_PRODUCTS[0]],
    ARIA_MODULES,
    VAYRO_CAPABILITIES
  }), /PRODUCT_IDENTITY_DUPLICATE/);
  assert.throws(() => assertProductFamilyContract({
    VAYRO_PRODUCTS: VAYRO_PRODUCTS.slice(1),
    ARIA_MODULES,
    VAYRO_CAPABILITIES
  }), /VAYRO_SUBAPP_FAMILY_INCOMPLETE/);
});

test("product-family contract rejects missing or duplicated legacy ARIA modules", () => {
  assert.throws(() => assertProductFamilyContract({
    VAYRO_PRODUCTS,
    ARIA_MODULES: ARIA_MODULES.slice(1),
    VAYRO_CAPABILITIES
  }), /ARIA_LEGACY_MODULES_INCOMPLETE/);
  assert.throws(() => assertProductFamilyContract({
    VAYRO_PRODUCTS,
    ARIA_MODULES: [...ARIA_MODULES, ARIA_MODULES[0]],
    VAYRO_CAPABILITIES
  }), /ARIA_LEGACY_MODULES_INCOMPLETE/);
});

test("DANA cannot be demoted to an internal platform capability", () => {
  assert.throws(() => assertProductFamilyContract({
    VAYRO_PRODUCTS,
    ARIA_MODULES,
    VAYRO_CAPABILITIES: [{ name: "DANA" }]
  }), /SUBAPP_MUST_NOT_BE_REGISTERED_AS_PLATFORM_CAPABILITY/);
});
