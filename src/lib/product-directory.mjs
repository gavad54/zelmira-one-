export const VAYRO_PRODUCTS = Object.freeze([
  { name: "ARIA", fa: "آریا", detail: "هوش مصنوعی عمومی، ارتباطات، خدمات و فضای کار دیجیتال", tag: "هوش مصنوعی و خدمات", status: "نسخه مهندسی؛ انتشار تولیدی تأیید نشده", statusClass: "blocked" },
  { name: "ARIANA", fa: "آریانا", detail: "حسابداری، امور مالی، دفترکل و ERP", tag: "حسابداری و ERP", status: "منبع آرشیوی؛ مخزن مستقل لازم است", statusClass: "blocked" },
  { name: "LEADORA", fa: "لیدورا", detail: "توزیع، فروش، موجودی، عملیات تجاری و رشد", tag: "عملیات کسب‌وکار", status: "کد موجود؛ استقرار Railway خاموش", statusClass: "blocked" },
  { name: "ARMIN MARKET", fa: "آرمین مارکت", detail: "بازارگاه، درخواست خریدار، پیشنهاد تأمین‌کننده و هوشمندی بازار", tag: "بازارگاه", status: "ساخت آزمایشی Android؛ سرویس زنده تأیید نشده", statusClass: "blocked" },
  { name: "DANA", fa: "دانا", detail: "اپلیکیشن مستقل مرکز فرماندهی و هماهنگی مجاز اکوسیستم", tag: "مرکز فرماندهی", status: "مستندات موجود؛ مخزن اجرایی مستقل پیدا نشده", statusClass: "blocked" },
  { name: "ARVAND", fa: "اروند", detail: "تجارت بین‌الملل، واردات، صادرات و عملیات بازرگانی", tag: "تجارت بین‌الملل", status: "مخزن مستقل پیدا نشده؛ توسعه لازم است", statusClass: "blocked" }
]);

// Backward-compatible alias: all six entries are independent direct VAYRO applications.
export const INDEPENDENT_PRODUCTS = VAYRO_PRODUCTS;

export const ARIA_DOMAINS = Object.freeze([
  { name: "GANJINEH", fa: "گنجینه", detail: "فروشگاه دیجیتال و ابزارهای کاتالوگ و فروش", status: "دامنه داخلی ARIA؛ تکمیل و اتصال لازم است", statusClass: "planned" },
  { name: "NEGAH", fa: "نگاه", detail: "استودیوی خلاقیت و تولید محتوا", status: "نمونه اولیه؛ اتصال سرویس و حقوق دارایی لازم است", statusClass: "prototype", href: "/negah/creative-studio" },
  { name: "SEPEHR", fa: "سپهر", detail: "ابزارهای ابری و مدیریت منابع با کنترل‌های privileged", status: "دامنه داخلی ARIA؛ کنترل‌پلین عملیاتی اثبات نشده", statusClass: "planned" },
  { name: "NAMA", fa: "نما", detail: "وب‌سایت‌ساز و صفحه‌ساز", status: "دامنه داخلی ARIA؛ ویرایشگر و انتشار کامل لازم است", statusClass: "planned" }
]);

// DANA is a direct independent application, not an internal VAYRO capability.
export const VAYRO_CAPABILITIES = Object.freeze([]);
export const ALL_PRODUCTS = VAYRO_PRODUCTS;
