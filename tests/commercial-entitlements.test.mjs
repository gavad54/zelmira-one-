import test from "node:test";
import assert from "node:assert/strict";
import { validateCommercialCatalog } from "../src/lib/commercial/catalog.mjs";
import { evaluateEntitlement } from "../src/lib/commercial/entitlements.mjs";

const plans = [
  {
    productKey: "aria",
    key: "free",
    tier: "free",
    status: "ACTIVE",
    billingPeriod: "month",
    price: { amountMinor: 0, currency: "USD" },
    limits: { requests: 3, ai_generations: 0, exports: null }
  },
  {
    productKey: "aria",
    key: "trial",
    tier: "trial",
    status: "ACTIVE",
    billingPeriod: "month",
    price: null,
    limits: { requests: 20, ai_generations: 5 }
  },
  {
    productKey: "aria",
    key: "pro",
    tier: "paid",
    status: "ACTIVE",
    billingPeriod: "month",
    price: null,
    limits: { requests: 100, ai_generations: 50 }
  }
];

const now = new Date("2026-11-19T10:00:00.000Z");
const activeSubscription = {
  status: "ACTIVE",
  startsAt: new Date("2026-11-01T00:00:00.000Z"),
  endsAt: null
};

test("catalog accepts explicit zero-price free plans and null price placeholders", () => {
  assert.deepEqual(validateCommercialCatalog(plans), []);
});

test("catalog rejects duplicate keys, fractional money, malformed currency and negative quotas", () => {
  const invalid = [
    ...plans,
    { ...plans[0], limits: { requests: -1 }, price: { amountMinor: 1.5, currency: "US" } }
  ];
  const issues = validateCommercialCatalog(invalid);
  assert.ok(issues.some(issue => issue.code === "DUPLICATE_PLAN"));
  assert.ok(issues.some(issue => issue.code === "INVALID_MONEY"));
  assert.ok(issues.some(issue => issue.code === "INVALID_CURRENCY"));
  assert.ok(issues.some(issue => issue.code === "INVALID_LIMIT"));
});

test("free plan works without a billing subscription and respects included quota", () => {
  const allowed = evaluateEntitlement({
    catalog: plans, tenantStatus: "ACTIVE", productKey: "aria", planKey: "free",
    subscription: null, featureKey: "requests", usage: 2, now
  });
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.reasonCode, "ALLOWED");
  assert.equal(allowed.remaining, 1);

  const denied = evaluateEntitlement({
    catalog: plans, tenantStatus: "ACTIVE", productKey: "aria", planKey: "free",
    subscription: null, featureKey: "requests", usage: 3, now
  });
  assert.equal(denied.allowed, false);
  assert.equal(denied.reasonCode, "USAGE_LIMIT_REACHED");
});

test("trial plan requires a live trial subscription", () => {
  const result = evaluateEntitlement({
    catalog: plans, tenantStatus: "ACTIVE", productKey: "aria", planKey: "trial",
    subscription: { status: "TRIALING", startsAt: new Date("2026-11-18T00:00:00Z"), endsAt: new Date("2026-11-25T00:00:00Z") },
    featureKey: "ai_generations", usage: 1, now
  });
  assert.equal(result.allowed, true);
});

test("paid plan requires active subscription and permits unlimited features", () => {
  const result = evaluateEntitlement({
    catalog: plans, tenantStatus: "ACTIVE", productKey: "aria", planKey: "pro",
    subscription: activeSubscription, featureKey: "exports", usage: 999, now
  });
  assert.equal(result.allowed, true);
  assert.equal(result.limit, null);
  assert.equal(result.remaining, null);
});

test("evaluation denies suspended tenants, wrong products and unknown plans", () => {
  const suspended = evaluateEntitlement({
    catalog: plans, tenantStatus: "SUSPENDED", productKey: "aria", planKey: "free",
    subscription: null, featureKey: "requests", usage: 0, now
  });
  assert.equal(suspended.reasonCode, "TENANT_NOT_ACTIVE");

  const wrongProduct = evaluateEntitlement({
    catalog: plans, tenantStatus: "ACTIVE", productKey: "leadora", planKey: "free",
    subscription: null, featureKey: "requests", usage: 0, now
  });
  assert.equal(wrongProduct.reasonCode, "PRODUCT_MISMATCH");

  const unknown = evaluateEntitlement({
    catalog: plans, tenantStatus: "ACTIVE", productKey: "aria", planKey: "unknown",
    subscription: null, featureKey: "requests", usage: 0, now
  });
  assert.equal(unknown.reasonCode, "PLAN_NOT_FOUND");
});

test("evaluation denies inactive, not-yet-started and expired subscriptions", () => {
  const evaluate = subscription => evaluateEntitlement({
    catalog: plans, tenantStatus: "ACTIVE", productKey: "aria", planKey: "pro",
    subscription, featureKey: "requests", usage: 0, now
  });
  assert.equal(evaluate({ ...activeSubscription, status: "CANCELLED" }).reasonCode, "SUBSCRIPTION_INACTIVE");
  assert.equal(evaluate({ status: "ACTIVE", startsAt: new Date("2026-11-20T00:00:00Z"), endsAt: null }).reasonCode, "SUBSCRIPTION_NOT_STARTED");
  assert.equal(evaluate({ status: "ACTIVE", startsAt: new Date("2026-11-01T00:00:00Z"), endsAt: new Date("2026-11-18T00:00:00Z") }).reasonCode, "SUBSCRIPTION_EXPIRED");
});

test("evaluation rejects missing features and invalid usage without throwing", () => {
  const common = {
    catalog: plans, tenantStatus: "ACTIVE", productKey: "aria", planKey: "free",
    subscription: null, now
  };
  assert.equal(evaluateEntitlement({ ...common, featureKey: "not_in_plan", usage: 0 }).reasonCode, "FEATURE_NOT_INCLUDED");
  assert.equal(evaluateEntitlement({ ...common, featureKey: "requests", usage: -1 }).reasonCode, "INVALID_USAGE");
  assert.equal(evaluateEntitlement({ ...common, featureKey: "requests", usage: 1.5 }).reasonCode, "INVALID_USAGE");
});
