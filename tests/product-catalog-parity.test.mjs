import test from "node:test";
import assert from "node:assert/strict";
import {
  ALL_PRODUCTS,
  VAYRO_CAPABILITIES as DIRECTORY_CAPABILITIES
} from "../src/lib/product-directory.mjs";
import {
  PRODUCT_CATALOG,
  VAYRO_CAPABILITIES as REGISTRY_CAPABILITIES
} from "../src/lib/product-catalog.mjs";

const productKey = name => name === "ARMIN MARKET" ? "ARMIN_MARKET" : name;

test("the public product directory and persisted platform registry expose the same eleven products", () => {
  assert.deepEqual(
    ALL_PRODUCTS.map(product => productKey(product.name)),
    PRODUCT_CATALOG.map(product => product.key)
  );
  assert.equal(ALL_PRODUCTS.length, 11);
  assert.equal(PRODUCT_CATALOG.length, 11);
  assert.equal(new Set(PRODUCT_CATALOG.map(product => product.key)).size, 11);
});

test("DANA is represented as a central capability and never as a sellable product", () => {
  assert.deepEqual(DIRECTORY_CAPABILITIES.map(item => item.name), ["DANA"]);
  assert.deepEqual(REGISTRY_CAPABILITIES.map(item => item.key), ["DANA"]);
  assert.ok(!ALL_PRODUCTS.some(item => item.name === "DANA"));
  assert.ok(!PRODUCT_CATALOG.some(item => item.key === "DANA"));
});

test("accounting and ERP remain exclusive to ARIANA and explicitly excluded from ARIA", () => {
  const aria = PRODUCT_CATALOG.find(product => product.key === "ARIA");
  const ariana = PRODUCT_CATALOG.find(product => product.key === "ARIANA");
  assert.ok(aria);
  assert.ok(ariana);
  assert.match(aria.description, /بدون حسابداری و ERP/);
  assert.match(ariana.description, /حسابداری، مالی و ERP/);
  assert.match(ariana.description, /مستقل از ARIA/);
});
