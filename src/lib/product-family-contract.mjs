const REQUIRED_SUBAPPS = Object.freeze([
  "DANA",
  "ARIANA",
  "LEADORA",
  "ARMIN MARKET",
  "ARIA"
]);

const REQUIRED_ARIA_MODULES = Object.freeze([
  "ARVAND",
  "CHARSU",
  "GANJINEH",
  "NEGAH",
  "SEPEHR",
  "NAMA",
  "PAYAM"
]);

export function assertProductFamilyContract({
  VAYRO_PRODUCTS = [],
  ARIA_MODULES = [],
  INDEPENDENT_PRODUCTS = [],
  VAYRO_CAPABILITIES = []
} = {}) {
  const subapps = VAYRO_PRODUCTS.length ? VAYRO_PRODUCTS : INDEPENDENT_PRODUCTS;
  const subappNames = subapps.map(product => product?.name);
  const moduleNames = ARIA_MODULES.map(module => module?.name);

  if (new Set(subappNames).size !== subappNames.length) {
    throw new Error("PRODUCT_IDENTITY_DUPLICATE");
  }
  if (REQUIRED_SUBAPPS.some(name => !subappNames.includes(name)) ||
      subappNames.some(name => !REQUIRED_SUBAPPS.includes(name)) ||
      subappNames.length !== REQUIRED_SUBAPPS.length) {
    throw new Error("VAYRO_SUBAPP_FAMILY_INCOMPLETE");
  }
  if (new Set(moduleNames).size !== moduleNames.length ||
      REQUIRED_ARIA_MODULES.some(name => !moduleNames.includes(name)) ||
      moduleNames.some(name => !REQUIRED_ARIA_MODULES.includes(name)) ||
      moduleNames.length !== REQUIRED_ARIA_MODULES.length) {
    throw new Error("ARIA_LEGACY_MODULES_INCOMPLETE");
  }

  const aria = subapps.find(product => product.name === "ARIA");
  const ariana = subapps.find(product => product.name === "ARIANA");
  const dana = subapps.find(product => product.name === "DANA");
  if (!aria || !/بدون حسابداری و ERP/.test(aria.detail || "")) {
    throw new Error("ARIA_ACCOUNTING_BOUNDARY_INVALID");
  }
  if (!ariana || !/حسابداری/.test(ariana.detail || "")) {
    throw new Error("ARIANA_ACCOUNTING_OWNERSHIP_INVALID");
  }
  if (!dana || !/مرکز فرماندهی/.test(dana.detail || "")) {
    throw new Error("DANA_MUST_BE_INDEPENDENT_COMMAND_CENTER");
  }
  if (ARIA_MODULES.some(module => module?.ownerProduct !== "ARIA" || module?.legacyKey !== module?.name)) {
    throw new Error("ARIA_LEGACY_MODULE_OWNERSHIP_INVALID");
  }

  const capabilityNames = VAYRO_CAPABILITIES.map(capability => capability?.name);
  if (new Set(capabilityNames).size !== capabilityNames.length ||
      capabilityNames.includes("DANA") ||
      capabilityNames.some(name => REQUIRED_SUBAPPS.includes(name))) {
    throw new Error("SUBAPP_MUST_NOT_BE_REGISTERED_AS_PLATFORM_CAPABILITY");
  }

  return true;
}
