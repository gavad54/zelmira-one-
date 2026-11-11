export const PRODUCT_FAMILY_CATALOG = Object.freeze([
  { key: "ARVAND", name: "ARVAND", description: "تجارت بین‌الملل، صادرات و واردات" },
  { key: "CHARSU", name: "CHARSU", description: "بازارگاه و شبکه خریدوفروش" },
  { key: "GANJINEH", name: "GANJINEH", description: "فروشگاه و تجارت الکترونیک" },
  { key: "NEGAH", name: "NEGAH", description: "استودیو خلاقیت و تولید محتوا" },
  { key: "SEPEHR", name: "SEPEHR", description: "زیرساخت ابری و خدمات فناوری" },
  { key: "NAMA", name: "NAMA", description: "ساخت وب‌سایت و صفحات فرود" },
  { key: "PAYAM", name: "PAYAM", description: "بازاریابی و توسعه مشتری" }
]);

export const INDEPENDENT_PRODUCT_CATALOG = Object.freeze([
  { key: "LEADORA", name: "LEADORA", description: "توزیع، فروش و عملیات تجاری؛ با پایگاه داده و استقرار مستقل" },
  { key: "ARIANA", name: "ARIANA", description: "حسابداری، مالی و ERP؛ مستقل از ARIA" },
  { key: "ARIA", name: "ARIA", description: "جامعه، خدمات و بازارگاه؛ بدون حسابداری و ERP" },
  { key: "ARMIN_MARKET", name: "ARMIN MARKET", description: "درخواست خریدار، پیشنهاد تأمین‌کننده و استعلام؛ بدون نگهداری وجوه طرفین" }
]);

// DANA is an internal VAYRO AI/orchestration capability, not a product registry entry.
export const VAYRO_CAPABILITIES = Object.freeze([
  { key: "DANA", name: "DANA", description: "هوش مصنوعی مرکزی و هماهنگی کنترل‌شده در مرکز فرماندهی" }
]);

// Registry membership does not imply production readiness or shared product data ownership.
export const PRODUCT_CATALOG = Object.freeze([
  ...PRODUCT_FAMILY_CATALOG,
  ...INDEPENDENT_PRODUCT_CATALOG
]);

const PRODUCT_STATUSES = new Set(["PLANNED", "ACTIVE", "MAINTENANCE", "RETIRED"]);

export function validateProductConfiguration({ status, baseUrl }) {
  if (!PRODUCT_STATUSES.has(status)) return { valid: false, error: "invalid_status" };

  if (baseUrl !== null && baseUrl !== undefined && baseUrl !== "") {
    if (typeof baseUrl !== "string") return { valid: false, error: "invalid_url" };
    try {
      const url = new URL(baseUrl);
      if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
        return { valid: false, error: "https_url_required" };
      }
    } catch {
      return { valid: false, error: "invalid_url" };
    }
  }

  if (status === "ACTIVE" && !baseUrl) {
    return { valid: false, error: "active_product_requires_url" };
  }

  return { valid: true };
}
