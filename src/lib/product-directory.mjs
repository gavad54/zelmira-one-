const FLAGSHIP_APPLICATIONS = Object.freeze([
  {
    name: "ARIA",
    detail: "هوش مصنوعی عمومی، ارتباطات، جامعه، خدمات و آگهی‌ها؛ مستقل و بدون حسابداری و ERP",
    status: "نمونه اولیه؛ تکمیل و انتشار مستقل لازم است",
    statusClass: "blocked"
  },
  {
    name: "ARIANA",
    detail: "حسابداری، مالی و ERP؛ مالک مستقل اسناد و داده‌های حسابداری",
    status: "SOURCE_NOT_LOCATED؛ ممیزی منبع لازم است",
    statusClass: "blocked"
  },
  {
    name: "LEADORA",
    detail: "توزیع، فروش، موجودی و عملیات تجاری؛ بدون دفترکل حسابداری",
    status: "نسخه موجود؛ انتشار نهایی مسدود",
    statusClass: "blocked"
  },
  {
    name: "ARMIN MARKET",
    detail: "درخواست خریدار، استعلام، پیشنهاد تأمین‌کننده و تأمین کالا",
    status: "نمونه اولیه؛ قابلیت‌های بازارگاه ناقص",
    statusClass: "blocked"
  }
]);

const PORTFOLIO_INITIATIVES = Object.freeze([
  { name: "ARVAND", fa: "اروند", detail: "تجارت بین‌الملل، صادرات و واردات", tag: "تجارت جهانی", status: "در صف توسعه", statusClass: "planned" },
  { name: "CHARSU", fa: "چهارسو", detail: "بازارگاه و شبکه خریدوفروش", tag: "بازارگاه", status: "در صف توسعه", statusClass: "planned" },
  { name: "GANJINEH", fa: "گنجینه", detail: "فروشگاه و تجارت الکترونیک", tag: "فروش دیجیتال", status: "در صف توسعه", statusClass: "planned" },
  { name: "NEGAH", fa: "نگاه", detail: "استودیو خلاقیت و تولید محتوا", tag: "خلاقیت", status: "نمونه اولیه؛ اتصال سرویس لازم", statusClass: "prototype", href: "/negah/creative-studio" },
  { name: "SEPEHR", fa: "سپهر", detail: "زیرساخت ابری و خدمات فناوری", tag: "زیرساخت", status: "در صف توسعه", statusClass: "planned" },
  { name: "NAMA", fa: "نما", detail: "ساخت وب‌سایت و صفحات فرود", tag: "وب‌ساز", status: "در صف توسعه", statusClass: "planned" },
  { name: "PAYAM", fa: "پیام", detail: "بازاریابی و توسعه مشتری", tag: "رشد کسب‌وکار", status: "در صف توسعه", statusClass: "planned" }
]);

const VAYRO_CAPABILITIES = Object.freeze([
  {
    name: "DANA",
    fa: "دانا",
    detail: "مرکز فرماندهی و هماهنگی هوشمند VAYRO برای چهار اپ مستقل؛ با دسترسی محدود، مجاز و قابل ممیزی",
    href: "/dana/ai-workspace",
    status: "مرکز فرماندهی اکوسیستم؛ نه محصول مستقل و نه جایگزین اپ‌ها"
  }
]);

// Compatibility exports retained for existing consumers.
export const VAYRO_PRODUCTS = PORTFOLIO_INITIATIVES;
export const INDEPENDENT_PRODUCTS = FLAGSHIP_APPLICATIONS;
export { FLAGSHIP_APPLICATIONS, PORTFOLIO_INITIATIVES, VAYRO_CAPABILITIES };
// Preserve the historical aggregate order for consumers that rely on it.
const LEGACY_INDEPENDENT_ORDER = Object.freeze(["LEADORA", "ARIANA", "ARIA", "ARMIN MARKET"]);
const LEGACY_INDEPENDENT_PRODUCTS = Object.freeze(
  LEGACY_INDEPENDENT_ORDER.map(name => FLAGSHIP_APPLICATIONS.find(product => product.name === name))
);
export const ALL_PRODUCTS = Object.freeze([...PORTFOLIO_INITIATIVES, ...LEGACY_INDEPENDENT_PRODUCTS]);
