import test from "node:test";
import assert from "node:assert/strict";
import { ALL_PRODUCTS, VAYRO_PRODUCTS, INDEPENDENT_PRODUCTS, VAYRO_CAPABILITIES } from "../src/lib/product-directory.mjs";

test("the home directory exposes exactly the five approved direct VAYRO sub-applications", () => {
  const expected = ["DANA", "ARIANA", "LEADORA", "ARMIN MARKET", "ARIA"];
  assert.deepEqual(VAYRO_PRODUCTS.map(item => item.name), expected);
  assert.deepEqual(INDEPENDENT_PRODUCTS.map(item => item.name), expected);
  assert.equal(ALL_PRODUCTS.length, 5);
  assert.deepEqual(ALL_PRODUCTS.map(item => item.name), expected);
  assert.equal(new Set(ALL_PRODUCTS.map(item => item.name)).size, 5);
  assert.equal(VAYRO_CAPABILITIES.some(item => item.name === "DANA"), false);
});

test("the directory preserves the accounting and operational product boundaries", () => {
  assert.match(VAYRO_PRODUCTS.find(item => item.name === "ARIA").detail, /بدون حسابداری و ERP/);
  assert.match(VAYRO_PRODUCTS.find(item => item.name === "ARIANA").detail, /حسابداری/);
  assert.match(VAYRO_PRODUCTS.find(item => item.name === "DANA").detail, /مرکز فرماندهی/);
  assert.ok(ALL_PRODUCTS.every(item => item.status && item.statusClass));
  assert.ok(ALL_PRODUCTS.every(item => item.statusClass !== "active"));
});

test("only product routes with implemented UI surfaces are linked", () => {
  assert.ok(VAYRO_PRODUCTS.filter(item => item.href).every(item => item.href.startsWith("/")));
  assert.deepEqual(VAYRO_CAPABILITIES, []);
});
