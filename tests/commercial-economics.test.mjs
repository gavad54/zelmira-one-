import test from "node:test";
import assert from "node:assert/strict";
import { calculateCommercialEconomics } from "../src/lib/commercial/economics.mjs";

const zeroInput = Object.freeze({
  currency: "USD",
  grossRevenueMinor: 0, discountsMinor: 0, refundsMinor: 0, chargebacksMinor: 0, taxesMinor: 0,
  paymentFeesMinor: 0, providerCostsMinor: 0, fulfillmentCostsMinor: 0, otherVariableCostsMinor: 0,
  fixedCostsMinor: 0, transactionCount: 0, ownerPaidOutlaysMinor: 0, ownerReimbursementsMinor: 0,
  sellerPaidPassThroughMinor: 0, userPaidPassThroughMinor: 0
});

const sample = Object.freeze({
  currency: "USD",
  grossRevenueMinor: 100000,
  discountsMinor: 5000,
  refundsMinor: 2000,
  chargebacksMinor: 1000,
  taxesMinor: 8000,
  paymentFeesMinor: 2000,
  providerCostsMinor: 5000,
  fulfillmentCostsMinor: 1000,
  otherVariableCostsMinor: 0,
  fixedCostsMinor: 20000,
  transactionCount: 100,
  ownerPaidOutlaysMinor: 15000,
  ownerReimbursementsMinor: 3000,
  sellerPaidPassThroughMinor: 2000,
  userPaidPassThroughMinor: 5000
});

test("calculates net revenue, contribution, operating profit and break-even in minor units", () => {
  const result = calculateCommercialEconomics(sample);
  assert.equal(result.currency, "USD");
  assert.equal(result.netRevenueMinor, 84000);
  assert.equal(result.variableCostsMinor, 8000);
  assert.equal(result.contributionProfitMinor, 76000);
  assert.equal(result.fixedCostsMinor, 20000);
  assert.equal(result.operatingProfitMinor, 56000);
  assert.equal(result.contributionMarginBps, 9048);
  assert.equal(result.operatingMarginBps, 6667);
  assert.equal(result.breakEvenRevenueMinor, 22106);
  assert.equal(result.breakEvenTransactions, 27);
  assert.equal(result.ownerCashExposureMinor, 12000);
  assert.equal(result.passThroughCostsMinor, 7000);
});

test("does not count seller/user pass-through amounts as owner revenue or operating profit", () => {
  const base = calculateCommercialEconomics(sample);
  const changedPassThrough = calculateCommercialEconomics({
    ...sample,
    sellerPaidPassThroughMinor: 900000,
    userPaidPassThroughMinor: 700000
  });
  assert.equal(changedPassThrough.netRevenueMinor, base.netRevenueMinor);
  assert.equal(changedPassThrough.operatingProfitMinor, base.operatingProfitMinor);
  assert.equal(changedPassThrough.ownerCashExposureMinor, base.ownerCashExposureMinor);
  assert.equal(changedPassThrough.passThroughCostsMinor, 1600000);
});

test("returns null break-even when contribution is zero or negative", () => {
  const result = calculateCommercialEconomics({
    ...zeroInput,
    currency: "IRR",
    grossRevenueMinor: 1000,
    paymentFeesMinor: 1200,
    fixedCostsMinor: 100,
    transactionCount: 10
  });
  assert.equal(result.contributionProfitMinor, -200);
  assert.equal(result.breakEvenRevenueMinor, null);
  assert.equal(result.breakEvenTransactions, null);
});

test("zero fixed costs have a zero break-even target", () => {
  const result = calculateCommercialEconomics({
    ...zeroInput,
    currency: "EUR",
    grossRevenueMinor: 500,
    transactionCount: 5
  });
  assert.equal(result.breakEvenRevenueMinor, 0);
  assert.equal(result.breakEvenTransactions, 0);
});

test("rejects malformed currency, fractional or negative money, and invalid transaction counts", () => {
  assert.throws(() => calculateCommercialEconomics({ ...zeroInput, currency: "us" }), TypeError);
  assert.throws(() => calculateCommercialEconomics({ ...zeroInput, grossRevenueMinor: 1.5 }), TypeError);
  assert.throws(() => calculateCommercialEconomics({ ...zeroInput, grossRevenueMinor: -1 }), RangeError);
  assert.throws(() => calculateCommercialEconomics({ ...zeroInput, transactionCount: 1.2 }), TypeError);
});

test("rejects deductions above gross revenue and unsafe integer totals", () => {
  assert.throws(() => calculateCommercialEconomics({
    ...zeroInput, grossRevenueMinor: 100, refundsMinor: 101
  }), RangeError);
  assert.throws(() => calculateCommercialEconomics({
    ...zeroInput, grossRevenueMinor: Number.MAX_SAFE_INTEGER,
    providerCostsMinor: Number.MAX_SAFE_INTEGER, fixedCostsMinor: 1
  }), RangeError);
});

test("does not mutate the caller's financial input", () => {
  const before = JSON.stringify(sample);
  calculateCommercialEconomics(sample);
  assert.equal(JSON.stringify(sample), before);
});
