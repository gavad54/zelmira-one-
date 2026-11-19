import test from "node:test";
import assert from "node:assert/strict";
import {
  ALL_PRODUCTS,
  FLAGSHIP_APPLICATIONS,
  PORTFOLIO_INITIATIVES,
  VAYRO_CAPABILITIES
} from "../src/lib/product-directory.mjs";

test("VAYRO command structure has exactly four independent flagship apps", () => {
  assert.deepEqual(FLAGSHIP_APPLICATIONS.map(item => item.name), [
    "ARIA", "ARIANA", "LEADORA", "ARMIN MARKET"
  ]);
  assert.equal(new Set(FLAGSHIP_APPLICATIONS.map(item => item.name)).size, 4);
  assert.ok(FLAGSHIP_APPLICATIONS.every(item => item.status && item.statusClass));
  assert.ok(FLAGSHIP_APPLICATIONS.every(item => item.statusClass !== "active"));
});

test("DANA is command capability and not one of the four apps", () => {
  assert.deepEqual(VAYRO_CAPABILITIES.map(item => item.name), ["DANA"]);
  assert.match(VAYRO_CAPABILITIES[0].status, /مرکز فرماندهی/);
  assert.ok(!FLAGSHIP_APPLICATIONS.some(item => item.name === "DANA"));
  assert.ok(!PORTFOLIO_INITIATIVES.some(item => item.name === "DANA"));
});

test("other initiatives remain in the VAYRO portfolio and are not misclassified as flagship apps", () => {
  assert.deepEqual(PORTFOLIO_INITIATIVES.map(item => item.name), [
    "ARVAND", "CHARSU", "GANJINEH", "NEGAH", "SEPEHR", "NAMA", "PAYAM"
  ]);
  assert.equal(ALL_PRODUCTS.length, 11);
  assert.equal(new Set(ALL_PRODUCTS.map(item => item.name)).size, 11);
});

test("only product routes with implemented UI surfaces are linked", () => {
  assert.deepEqual(PORTFOLIO_INITIATIVES.filter(item => item.href).map(item => item.name), ["NEGAH"]);
  assert.deepEqual(VAYRO_CAPABILITIES.map(item => item.href), ["/dana/ai-workspace"]);
  assert.ok(PORTFOLIO_INITIATIVES.filter(item => item.href).every(item => item.href.startsWith("/")));
});
