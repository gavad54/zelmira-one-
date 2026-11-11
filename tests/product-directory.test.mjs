import test from "node:test";
import assert from "node:assert/strict";
import { ALL_PRODUCTS, VAYRO_PRODUCTS, INDEPENDENT_PRODUCTS, VAYRO_CAPABILITIES } from "../src/lib/product-directory.mjs";

test("the home directory exposes exactly seven platform-family products and four independent products", () => {
  assert.equal(VAYRO_PRODUCTS.length, 7);
  assert.equal(INDEPENDENT_PRODUCTS.length, 4);
  assert.equal(ALL_PRODUCTS.length, 11);
  assert.deepEqual(ALL_PRODUCTS.map(item => item.name), [
    "ARVAND", "CHARSU", "GANJINEH", "NEGAH", "SEPEHR", "NAMA", "PAYAM",
    "LEADORA", "ARIANA", "ARIA", "ARMIN MARKET"
  ]);
  assert.equal(new Set(ALL_PRODUCTS.map(item => item.name)).size, 11);
  assert.deepEqual(VAYRO_CAPABILITIES.map(item => item.name), ["DANA"]);
});

test("the directory never presents a child product as production-active", () => {
  assert.ok(ALL_PRODUCTS.every(item => item.status && item.statusClass));
  assert.ok(ALL_PRODUCTS.every(item => item.statusClass !== "active"));
  assert.equal(VAYRO_PRODUCTS.find(item => item.name === "NEGAH")?.statusClass, "prototype");
  assert.ok(VAYRO_PRODUCTS.filter(item => item.name !== "NEGAH").every(item => item.statusClass === "planned"));
  assert.ok(INDEPENDENT_PRODUCTS.every(item => item.statusClass === "blocked"));
  assert.match(VAYRO_CAPABILITIES[0].status, /نه محصول مستقل/);
});

test("only product routes with implemented UI surfaces are linked", () => {
  assert.deepEqual(VAYRO_PRODUCTS.filter(item => item.href).map(item => item.name), ["NEGAH"]);
  assert.deepEqual(VAYRO_CAPABILITIES.map(item => item.href), ["/dana/ai-workspace"]);
  assert.ok(VAYRO_PRODUCTS.filter(item => item.href).every(item => item.href.startsWith("/")));
});
