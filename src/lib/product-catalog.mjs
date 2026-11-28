export const VAYRO_SUBAPP_CATALOG = Object.freeze([
  { key: "DANA", name: "DANA", description: "مرکز فرماندهی مستقل، هوش مصنوعی و هماهنگی کنترل‌شده" },
  { key: "ARIANA", name: "ARIANA", description: "حسابداری، مالی، مالیات، بودجه و ERP" },
  { key: "LEADORA", name: "LEADORA", description: "توزیع، فروش و عملیات تجاری مستقل" },
  { key: "ARMIN_MARKET", name: "ARMIN MARKET", description: "بازارگاه مستقل درخواست خریدار و پیشنهاد تأمین‌کننده" },
  { key: "ARIA", name: "ARIA", description: "جامعه، خدمات و کسب‌وکار؛ شامل ماژول‌های قدیمی و بدون حسابداری و ERP" }
]);

export const ARIA_MODULE_CATALOG = Object.freeze([
  { key: "ARVAND", name: "ARVAND", description: "ماژول تجارت بین‌الملل، صادرات و واردات در ARIA" },
  { key: "CHARSU", name: "CHARSU", description: "ماژول بازارگاه و شبکه خریدوفروش در ARIA" },
  { key: "GANJINEH", name: "GANJINEH", description: "ماژول فروشگاه و تجارت الکترونیک در ARIA" },
  { key: "NEGAH", name: "NEGAH", description: "ماژول استودیو خلاقیت و تولید محتوا در ARIA" },
  { key: "SEPEHR", name: "SEPEHR", description: "ماژول زیرساخت ابری و خدمات فناوری در ARIA" },
  { key: "NAMA", name: "NAMA", description: "ماژول ساخت وب‌سایت و صفحات فرود در ARIA" },
  { key: "PAYAM", name: "PAYAM", description: "ماژول بازاریابی و توسعه مشتری در ARIA" }
]);

// Backward-compatible exports: legacy product identities now represent ARIA modules.
export const PRODUCT_FAMILY_CATALOG = ARIA_MODULE_CATALOG;
export const INDEPENDENT_PRODUCT_CATALOG = VAYRO_SUBAPP_CATALOG;
export const VAYRO_CAPABILITIES = Object.freeze([]);
export const PRODUCT_CATALOG = VAYRO_SUBAPP_CATALOG;

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
