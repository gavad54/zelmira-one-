export const PRODUCT_CATALOG = Object.freeze([
  { key: "ARVAND", name: "ARVAND", description: "تجارت بین‌الملل، صادرات و واردات" },
  { key: "CHARSU", name: "CHARSU", description: "بازارگاه و شبکه خریدوفروش" },
  { key: "GANJINEH", name: "GANJINEH", description: "فروشگاه و تجارت الکترونیک" },
  { key: "NEGAH", name: "NEGAH", description: "استودیو خلاقیت و تولید محتوا" },
  { key: "SEPEHR", name: "SEPEHR", description: "زیرساخت ابری و خدمات فناوری" },
  { key: "NAMA", name: "NAMA", description: "ساخت وب‌سایت و صفحات فرود" },
  { key: "PAYAM", name: "PAYAM", description: "بازاریابی و توسعه مشتری" },
  { key: "ARIA", name: "ARIA", description: "سوپر‌اپ هوشمند، اجتماعی و خدماتی؛ بدون حسابداری و ERP" },
  { key: "ARIANA", name: "ARIANA", description: "حسابداری، مالی، مالیاتی و برنامه‌ریزی منابع سازمانی (ERP)" },
  { key: "LEADORA", name: "LEADORA", description: "مدیریت کسب‌وکار، توزیع، فروش، انبار و عملیات" },
  { key: "ARMIN_MARKET", name: "ARMIN MARKET", description: "بازار درخواست خریداران و دریافت پیشنهاد تأمین‌کنندگان" }
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
