import test from "node:test";
import assert from "node:assert/strict";
import { ALL_PRODUCTS, VAYRO_PRODUCTS, INDEPENDENT_PRODUCTS } from "../src/lib/product-directory.mjs";

test("the home directory exposes exactly eight VAYRO products and three independent products", () => {
  assert.equal(VAYRO_PRODUCTS.length, 8);
  assert.equal(INDEPENDENT_PRODUCTS.length, 3);
  assert.equal(ALL_PRODUCTS.length, 11);
  assert.deepEqual(ALL_PRODUCTS.map(item => item.name), [
    "ARVAND", "CHARSU", "GANJINEH", "NEGAH", "SEPEHR", "NAMA", "PAYAM", "DANA",
    "LEADORA", "ARIANA", "ARIA"
  ]);
  assert.equal(new Set(ALL_PRODUCTS.map(item => item.name)).size, 11);
});

test("the directory never presents a child product as production-active", () => {
  assert.ok(ALL_PRODUCTS.every(item => item.status && item.statusClass));
  assert.ok(ALL_PRODUCTS.every(item => item.statusClass !== "active"));
  assert.ok(VAYRO_PRODUCTS.filter(item => ["DANA", "NEGAH"].includes(item.name)).every(item => item.statusClass === "prototype"));
  assert.ok(VAYRO_PRODUCTS.filter(item => !["DANA", "NEGAH"].includes(item.name)).every(item => item.statusClass === "planned"));
  assert.ok(INDEPENDENT_PRODUCTS.every(item => item.statusClass === "blocked"));
});

test("only product routes with implemented UI surfaces are linked", () => {
  assert.deepEqual(VAYRO_PRODUCTS.filter(item => item.href).map(item => item.name), ["NEGAH", "DANA"]);
  assert.ok(VAYRO_PRODUCTS.filter(item => item.href).every(item => item.href.startsWith("/")));
});
