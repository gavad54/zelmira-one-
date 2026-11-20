const DIRECT_VAYRO_PRODUCTS = Object.freeze([
  { key: "ARIA", name: "ARIA", description: "هوش مصنوعی عمومی، ارتباطات، خدمات و فضای کار دیجیتال؛ بدون حسابداری، دفترکل یا ERP" },
  { key: "ARIANA", name: "ARIANA", description: "حسابداری، امور مالی، دفترکل و ERP؛ تنها مرجع این حوزه در خانواده VAYRO" },
  { key: "LEADORA", name: "LEADORA", description: "توزیع، فروش، موجودی، عملیات تجاری، مشتری‌یابی و بازاریابی/رشد" },
  { key: "ARMIN_MARKET", name: "ARMIN MARKET", description: "بازارگاه، درخواست خریدار، پیشنهاد تأمین‌کننده و هوشمندی بازار؛ بدون نگهداری وجوه طرفین" },
  { key: "DANA", name: "DANA", description: "اپلیکیشن مستقل مرکز فرماندهی و هماهنگی مجاز اکوسیستم از طریق APIهای نسخه‌دار" },
  { key: "ARVAND", name: "ARVAND", description: "تجارت بین‌الملل، واردات، صادرات، تأمین و عملیات بازرگانی" }
]);

export const PRODUCT_FAMILY_CATALOG = DIRECT_VAYRO_PRODUCTS;
// Compatibility alias only; do not concatenate it with PRODUCT_FAMILY_CATALOG.
export const INDEPENDENT_PRODUCT_CATALOG = DIRECT_VAYRO_PRODUCTS;

export const ARIA_INTERNAL_DOMAINS = Object.freeze([
  { key: "GANJINEH", name: "GANJINEH", description: "فروشگاه دیجیتال و ابزارهای کاتالوگ و فروش درون ARIA" },
  { key: "NEGAH", name: "NEGAH", description: "استودیوی خلاقیت و تولید محتوا درون ARIA" },
  { key: "SEPEHR", name: "SEPEHR", description: "ابزارهای ابری و مدیریت منابع درون ARIA" },
  { key: "NAMA", name: "NAMA", description: "وب‌سایت‌ساز و صفحه‌ساز درون ARIA" }
]);

// DANA is now a direct product, not a capability entry.
export const VAYRO_CAPABILITIES = Object.freeze([]);
export const PRODUCT_CATALOG = DIRECT_VAYRO_PRODUCTS;

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
