const MONEY_FIELDS = Object.freeze([
  "grossRevenueMinor",
  "discountsMinor",
  "refundsMinor",
  "chargebacksMinor",
  "taxesMinor",
  "paymentFeesMinor",
  "providerCostsMinor",
  "fulfillmentCostsMinor",
  "otherVariableCostsMinor",
  "fixedCostsMinor",
  "ownerPaidOutlaysMinor",
  "ownerReimbursementsMinor",
  "sellerPaidPassThroughMinor",
  "userPaidPassThroughMinor"
]);

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

function requireSafeInteger(value, name) {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new TypeError(`${name} must be a safe integer in minor currency units.`);
  }
  if (value < 0) {
    throw new RangeError(`${name} cannot be negative.`);
  }
  return value;
}

function safeSum(values, name) {
  const total = values.reduce((sum, value) => sum + BigInt(value), 0n);
  if (total > MAX_SAFE) {
    throw new RangeError(`${name} exceeds the safe integer range.`);
  }
  return Number(total);
}

function ceilRatio(numerator, denominator, name) {
  if (denominator <= 0n) {
    throw new RangeError(`${name} denominator must be positive.`);
  }
  const value = (numerator + denominator - 1n) / denominator;
  if (value > MAX_SAFE) {
    throw new RangeError(`${name} exceeds the safe integer range.`);
  }
  return Number(value);
}

function marginBasisPoints(profitMinor, revenueMinor) {
  if (revenueMinor === 0) return null;
  const profit = BigInt(profitMinor);
  const revenue = BigInt(revenueMinor);
  const scaled = profit * 10000n;
  const rounded = scaled >= 0n
    ? (scaled + revenue / 2n) / revenue
    : -((-scaled + revenue / 2n) / revenue);
  if (rounded > MAX_SAFE || rounded < -MAX_SAFE) {
    throw new RangeError("Margin basis points exceed the safe integer range.");
  }
  return Number(rounded);
}

/**
 * Calculates period unit economics from complete, same-currency integer
 * minor-unit inputs. This is an analytical function only: it does not price,
 * invoice, collect, refund, settle, or transfer money.
 *
 * Seller/user pass-through costs are reported separately and never treated as
 * owner revenue, owner expense, or operating profit.
 */
export function calculateCommercialEconomics(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Economics input must be an object.");
  }
  if (typeof input.currency !== "string" || !/^[A-Z]{3}$/.test(input.currency)) {
    throw new TypeError("Currency must be a three-letter uppercase code.");
  }

  const values = {};
  for (const field of MONEY_FIELDS) {
    if (!Object.hasOwn(input, field)) {
      throw new TypeError(`${field} is required; missing costs must not be treated as zero.`);
    }
    values[field] = requireSafeInteger(input[field], field);
  }
  if (!Object.hasOwn(input, "transactionCount")) {
    throw new TypeError("transactionCount is required.");
  }
  const transactionCount = requireSafeInteger(input.transactionCount, "transactionCount");

  const deductionsMinor = safeSum([
    values.discountsMinor,
    values.refundsMinor,
    values.chargebacksMinor,
    values.taxesMinor
  ], "Revenue deductions");
  if (deductionsMinor > values.grossRevenueMinor) {
    throw new RangeError("Discounts, refunds, chargebacks and taxes cannot exceed gross revenue.");
  }

  const netRevenueMinor = values.grossRevenueMinor - deductionsMinor;
  const variableCostsMinor = safeSum([
    values.paymentFeesMinor,
    values.providerCostsMinor,
    values.fulfillmentCostsMinor,
    values.otherVariableCostsMinor
  ], "Variable costs");
  safeSum([variableCostsMinor, values.fixedCostsMinor], "Total operating costs");

  const contributionProfitMinor = netRevenueMinor - variableCostsMinor;
  const operatingProfitMinor = contributionProfitMinor - values.fixedCostsMinor;
  const passThroughCostsMinor = safeSum([
    values.sellerPaidPassThroughMinor,
    values.userPaidPassThroughMinor
  ], "Pass-through costs");
  const ownerCashExposureMinor =
    values.ownerPaidOutlaysMinor - values.ownerReimbursementsMinor;

  let breakEvenRevenueMinor = null;
  let breakEvenTransactions = null;
  if (netRevenueMinor > 0 && contributionProfitMinor > 0) {
    if (values.fixedCostsMinor === 0) {
      breakEvenRevenueMinor = 0;
      breakEvenTransactions = 0;
    } else {
      breakEvenRevenueMinor = ceilRatio(
        BigInt(values.fixedCostsMinor) * BigInt(netRevenueMinor),
        BigInt(contributionProfitMinor),
        "Break-even revenue"
      );
      if (transactionCount > 0) {
        breakEvenTransactions = ceilRatio(
          BigInt(values.fixedCostsMinor) * BigInt(transactionCount),
          BigInt(contributionProfitMinor),
          "Break-even transactions"
        );
      }
    }
  }

  return {
    currency: input.currency,
    grossRevenueMinor: values.grossRevenueMinor,
    deductionsMinor,
    netRevenueMinor,
    variableCostsMinor,
    contributionProfitMinor,
    fixedCostsMinor: values.fixedCostsMinor,
    operatingProfitMinor,
    contributionMarginBps: marginBasisPoints(contributionProfitMinor, netRevenueMinor),
    operatingMarginBps: marginBasisPoints(operatingProfitMinor, netRevenueMinor),
    breakEvenRevenueMinor,
    breakEvenTransactions,
    ownerCashExposureMinor,
    passThroughCostsMinor,
    transactionCount
  };
}
