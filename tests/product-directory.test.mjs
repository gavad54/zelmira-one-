import test from "node:test";
import assert from "node:assert/strict";
import { ALL_PRODUCTS, VAYRO_PRODUCTS, PLATFORM_CAPABILITIES, INDEPENDENT_PRODUCTS } from "../src/lib/product-directory.mjs";

test("the home directory exposes exactly seven approved VAYRO products, platform capabilities and three independent products", () => {
  assert.equal(VAYRO_PRODUCTS.length, 7);
  assert.equal(PLATFORM_CAPABILITIES.length, 1);
  assert.equal(INDEPENDENT_PRODUCTS.length, 3);
  assert.equal(ALL_PRODUCTS.length, 10);
  assert.deepEqual(ALL_PRODUCTS.map(item => item.name), [
    "ARVAND", "CHARSU", "GANJINEH", "NEGAH", "SEPEHR", "NAMA", "PAYAM",
    "LEADORA", "ARIANA", "ARIA"
  ]);
  assert.equal(new Set(ALL_PRODUCTS.map(item => item.name)).size, 10);
  assert.equal(PLATFORM_CAPABILITIES[0].name, "DANA");
});

test("the directory never presents a child product as production-active", () => {
  assert.ok(ALL_PRODUCTS.every(item => item.status && item.statusClass));
  assert.ok(ALL_PRODUCTS.every(item => item.statusClass !== "active"));
  assert.ok(VAYRO_PRODUCTS.filter(item => item.name === "NEGAH").every(item => item.statusClass === "prototype"));
  assert.ok(VAYRO_PRODUCTS.filter(item => item.name !== "NEGAH").every(item => item.statusClass === "planned"));
  assert.ok(PLATFORM_CAPABILITIES.every(item => item.statusClass === "prototype"));
  assert.ok(INDEPENDENT_PRODUCTS.every(item => item.statusClass === "blocked"));
});

test("only product routes with implemented UI surfaces are linked", () => {
  assert.deepEqual(VAYRO_PRODUCTS.filter(item => item.href).map(item => item.name), ["NEGAH"]);
  assert.ok(VAYRO_PRODUCTS.filter(item => item.href).every(item => item.href.startsWith("/")));
  assert.deepEqual(PLATFORM_CAPABILITIES.map(item => item.href), ["/dana/ai-workspace"]);
});
