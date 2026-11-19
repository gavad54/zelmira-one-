import { validateCommercialCatalog } from "./catalog.mjs";

const deny = (reasonCode, extra = {}) => ({
  allowed: false,
  reasonCode,
  limit: null,
  remaining: null,
  ...extra
});

const asTime = value => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" || typeof value === "number") return new Date(value).getTime();
  return Number.NaN;
};

/**
 * Pure entitlement decision. It never writes to a database, changes a
 * subscription, contacts a provider, or charges a customer.
 *
 * Free plans do not require a billing subscription. Trial plans require a
 * TRIALING subscription. Paid and enterprise plans require ACTIVE status.
 * A null feature limit means unlimited usage.
 */
export function evaluateEntitlement({
  catalog,
  tenantStatus,
  productKey,
  planKey,
  subscription = null,
  featureKey,
  usage = 0,
  now = new Date()
}) {
  if (validateCommercialCatalog(catalog).length > 0) {
    return deny("CATALOG_INVALID");
  }
  if (tenantStatus !== "ACTIVE") {
    return deny("TENANT_NOT_ACTIVE");
  }

  const matches = catalog.filter(plan => plan.key === planKey);
  if (matches.length === 0) return deny("PLAN_NOT_FOUND");
  const plan = matches.find(candidate => candidate.productKey === productKey);
  if (!plan) return deny("PRODUCT_MISMATCH");
  if (plan.status !== "ACTIVE") return deny("PLAN_NOT_ACTIVE");

  if (plan.tier !== "free") {
    if (!subscription) return deny("SUBSCRIPTION_INACTIVE");
    const expectedStatus = plan.tier === "trial" ? "TRIALING" : "ACTIVE";
    if (subscription.status !== expectedStatus) return deny("SUBSCRIPTION_INACTIVE");

    const currentTime = asTime(now);
    const startsAt = asTime(subscription.startsAt);
    const endsAt = subscription.endsAt == null ? null : asTime(subscription.endsAt);
    if (!Number.isFinite(currentTime) || !Number.isFinite(startsAt) || (endsAt !== null && !Number.isFinite(endsAt))) {
      return deny("INVALID_SUBSCRIPTION");
    }
    if (currentTime < startsAt) return deny("SUBSCRIPTION_NOT_STARTED");
    if (endsAt !== null && currentTime >= endsAt) return deny("SUBSCRIPTION_EXPIRED");
  }

  if (!Number.isSafeInteger(usage) || usage < 0) return deny("INVALID_USAGE");
  if (typeof featureKey !== "string" || !Object.hasOwn(plan.limits, featureKey)) {
    return deny("FEATURE_NOT_INCLUDED");
  }

  const limit = plan.limits[featureKey];
  if (limit === null) {
    return { allowed: true, reasonCode: "ALLOWED", limit: null, remaining: null };
  }
  if (usage >= limit) {
    return { allowed: false, reasonCode: "USAGE_LIMIT_REACHED", limit, remaining: 0 };
  }
  return { allowed: true, reasonCode: "ALLOWED", limit, remaining: limit - usage };
}
