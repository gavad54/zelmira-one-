const TIERS = new Set(["free", "trial", "paid", "enterprise"]);
const BILLING_PERIODS = new Set(["month", "year", "one_time"]);
const PLAN_STATUSES = new Set(["ACTIVE", "INACTIVE"]);

const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
const isNonNegativeInteger = value => Number.isSafeInteger(value) && value >= 0;

/**
 * Validate the commercial catalogue without assigning prices or contacting a
 * payment provider. Prices are integer minor units; null means not yet priced.
 * Returns stable, machine-readable issues. An empty array means valid.
 */
export function validateCommercialCatalog(catalog) {
  const issues = [];
  if (!Array.isArray(catalog)) {
    return [{ code: "INVALID_CATALOG", path: "$", message: "Catalog must be an array." }];
  }

  const seen = new Set();
  for (let index = 0; index < catalog.length; index += 1) {
    const plan = catalog[index];
    const path = `$[${index}]`;
    if (!isRecord(plan)) {
      issues.push({ code: "INVALID_PLAN", path, message: "Plan must be an object." });
      continue;
    }

    const productKey = typeof plan.productKey === "string" ? plan.productKey.trim() : "";
    const planKey = typeof plan.key === "string" ? plan.key.trim() : "";
    if (!productKey || !planKey) {
      issues.push({ code: "INVALID_PLAN_KEY", path, message: "Product and plan keys are required." });
    } else {
      const identity = `${productKey}:${planKey}`;
      if (seen.has(identity)) {
        issues.push({ code: "DUPLICATE_PLAN", path, message: "Product and plan key must be unique." });
      }
      seen.add(identity);
    }

    if (!TIERS.has(plan.tier)) {
      issues.push({ code: "INVALID_TIER", path: `${path}.tier`, message: "Unsupported plan tier." });
    }
    if (!PLAN_STATUSES.has(plan.status)) {
      issues.push({ code: "INVALID_PLAN_STATUS", path: `${path}.status`, message: "Unsupported plan status." });
    }
    if (!BILLING_PERIODS.has(plan.billingPeriod)) {
      issues.push({ code: "INVALID_BILLING_PERIOD", path: `${path}.billingPeriod`, message: "Unsupported billing period." });
    }

    if (plan.price !== null) {
      if (!isRecord(plan.price) || !isNonNegativeInteger(plan.price.amountMinor)) {
        issues.push({ code: "INVALID_MONEY", path: `${path}.price`, message: "Price must use a non-negative integer minor-unit amount or null." });
      }
      if (!isRecord(plan.price) || typeof plan.price.currency !== "string" || !/^[A-Z]{3}$/.test(plan.price.currency)) {
        issues.push({ code: "INVALID_CURRENCY", path: `${path}.price.currency`, message: "Currency must be a three-letter uppercase code." });
      }
    }

    if (!isRecord(plan.limits)) {
      issues.push({ code: "INVALID_LIMITS", path: `${path}.limits`, message: "Limits must be an object." });
    } else {
      for (const [feature, limit] of Object.entries(plan.limits)) {
        if (!feature.trim() || (limit !== null && !isNonNegativeInteger(limit))) {
          issues.push({ code: "INVALID_LIMIT", path: `${path}.limits.${feature}`, message: "A feature limit must be a non-negative integer or null for unlimited." });
        }
      }
    }
  }
  return issues;
}
