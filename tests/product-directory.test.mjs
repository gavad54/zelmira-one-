import test from "node:test";
import assert from "node:assert/strict";
import { ALL_PRODUCTS, VAYRO_PRODUCTS, INDEPENDENT_PRODUCTS, ARIA_DOMAINS, VAYRO_CAPABILITIES } from "../src/lib/product-directory.mjs";

test("the public directory exposes exactly six independent direct VAYRO applications", () => {
  const expected = ["ARIA", "ARIANA", "LEADORA", "ARMIN MARKET", "DANA", "ARVAND"];
  assert.equal(VAYRO_PRODUCTS.length, 6);
  assert.equal(INDEPENDENT_PRODUCTS.length, 6);
  assert.equal(ALL_PRODUCTS.length, 6);
  assert.deepEqual(ALL_PRODUCTS.map(item => item.name), expected);
  assert.deepEqual(INDEPENDENT_PRODUCTS.map(item => item.name), expected);
  assert.equal(new Set(ALL_PRODUCTS.map(item => item.name)).size, 6);
  assert.deepEqual(VAYRO_CAPABILITIES, []);
});

test("the four named ARIA areas are internal domains, not additional VAYRO applications", () => {
  assert.deepEqual(ARIA_DOMAINS.map(item => item.name), ["GANJINEH", "NEGAH", "SEPEHR", "NAMA"]);
  assert.equal(ARIA_DOMAINS.length, 4);
  assert.ok(ARIA_DOMAINS.every(item => item.status && item.statusClass));
  assert.ok(!ALL_PRODUCTS.some(item => ["GANJINEH", "NEGAH", "SEPEHR", "NAMA", "CHARSU", "PAYAM"].includes(item.name)));
});

test("all six direct products are explicitly non-production until release evidence exists", () => {
  assert.ok(ALL_PRODUCTS.every(item => item.status && item.statusClass === "blocked"));
});

test("only an implemented ARIA-domain UI surface is linked from the domain directory", () => {
  assert.deepEqual(ARIA_DOMAINS.filter(item => item.href).map(item => item.name), ["NEGAH"]);
  assert.ok(ARIA_DOMAINS.filter(item => item.href).every(item => item.href.startsWith("/")));
});
