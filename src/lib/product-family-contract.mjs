const REQUIRED_PLATFORM_PRODUCTS = Object.freeze([
  "ARVAND",
  "CHARSU",
  "GANJINEH",
  "NEGAH",
  "SEPEHR",
  "NAMA",
  "PAYAM"
]);
const REQUIRED_INDEPENDENT_PRODUCTS = Object.freeze([
  "LEADORA",
  "ARIANA",
  "ARIA",
  "ARMIN MARKET"
]);

export function assertProductFamilyContract({
  VAYRO_PRODUCTS = [],
  INDEPENDENT_PRODUCTS = [],
  VAYRO_CAPABILITIES = []
} = {}) {
  const platformNames = VAYRO_PRODUCTS.map(product => product?.name);
  const independentNames = INDEPENDENT_PRODUCTS.map(product => product?.name);
  const allNames = [...platformNames, ...independentNames];
  if (new Set(allNames).size !== allNames.length) {
    throw new Error("PRODUCT_IDENTITY_DUPLICATE");
  }
  const expected = [...REQUIRED_PLATFORM_PRODUCTS, ...REQUIRED_INDEPENDENT_PRODUCTS];
  if (expected.some(name => !allNames.includes(name)) ||
      allNames.some(name => !expected.includes(name))) {
    throw new Error("PRODUCT_FAMILY_INCOMPLETE");
  }
  const capabilityNames = VAYRO_CAPABILITIES.map(capability => capability?.name);
  if (new Set(capabilityNames).size !== capabilityNames.length) {
    throw new Error("PLATFORM_CAPABILITY_DUPLICATE");
  }
  if (capabilityNames.filter(name => name === "DANA").length !== 1 ||
      capabilityNames.some(name => name !== "DANA")) {
    throw new Error("DANA_PLATFORM_CAPABILITY_REQUIRED");
  }
  if (VAYRO_CAPABILITIES.some(capability => allNames.includes(capability?.name))) {
    throw new Error("PLATFORM_CAPABILITY_MUST_NOT_BE_PRODUCT");
  }
  const aria = INDEPENDENT_PRODUCTS.find(product => product.name === "ARIA");
  const ariana = INDEPENDENT_PRODUCTS.find(product => product.name === "ARIANA");
  if (!aria || !/بدون حسابداری و ERP/.test(aria.detail || "")) {
    throw new Error("ARIA_ACCOUNTING_BOUNDARY_INVALID");
  }
  if (!ariana || !/حسابداری/.test(ariana.detail || "")) {
    throw new Error("ARIANA_ACCOUNTING_OWNERSHIP_INVALID");
  }
  return true;
}
