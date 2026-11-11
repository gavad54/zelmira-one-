export const VAYRO_PRODUCTS = Object.freeze([
  { name: "ARVAND", fa: "اروند", detail: "تجارت بین‌الملل، صادرات و واردات", tag: "تجارت جهانی", status: "در صف توسعه", statusClass: "planned" },
  { name: "CHARSU", fa: "چهارسو", detail: "بازارگاه و شبکه خریدوفروش", tag: "بازارگاه", status: "در صف توسعه", statusClass: "planned" },
  { name: "GANJINEH", fa: "گنجینه", detail: "فروشگاه و تجارت الکترونیک", tag: "فروش دیجیتال", status: "در صف توسعه", statusClass: "planned" },
  { name: "NEGAH", fa: "نگاه", detail: "استودیو خلاقیت و تولید محتوا", tag: "خلاقیت", status: "نمونه اولیه؛ اتصال سرویس لازم", statusClass: "prototype", href: "/negah/creative-studio" },
  { name: "SEPEHR", fa: "سپهر", detail: "زیرساخت ابری و خدمات فناوری", tag: "زیرساخت", status: "در صف توسعه", statusClass: "planned" },
  { name: "NAMA", fa: "نما", detail: "ساخت وب‌سایت و صفحات فرود", tag: "وب‌ساز", status: "در صف توسعه", statusClass: "planned" },
  { name: "PAYAM", fa: "پیام", detail: "بازاریابی و توسعه مشتری", tag: "رشد کسب‌وکار", status: "در صف توسعه", statusClass: "planned" }
]);

export const INDEPENDENT_PRODUCTS = Object.freeze([
  { name: "LEADORA", detail: "توزیع، فروش و عملیات تجاری", status: "نسخه موجود؛ انتشار نهایی مسدود", statusClass: "blocked" },
  { name: "ARIANA", detail: "حسابداری، مالی و ERP", status: "ممیزی و انتشار مستقل لازم است", statusClass: "blocked" },
  { name: "ARIA", detail: "جامعه، خدمات و بازارگاه؛ بدون حسابداری و ERP", status: "ممیزی و انتشار مستقل لازم است", statusClass: "blocked" },
  { name: "ARMIN MARKET", detail: "درخواست خریدار، دریافت پیشنهاد و استعلام تأمین‌کننده", status: "ممیزی و انتشار مستقل لازم است", statusClass: "blocked" }
]);

export const VAYRO_CAPABILITIES = Object.freeze([
  { name: "DANA", fa: "دانا", detail: "هوش مصنوعی مرکزی برای تحلیل، دستیار و هماهنگی کنترل‌شده در مرکز فرماندهی", href: "/dana/ai-workspace", status: "قابلیت مرکزی؛ نه محصول مستقل" }
]);

export const ALL_PRODUCTS = Object.freeze([...VAYRO_PRODUCTS, ...INDEPENDENT_PRODUCTS]);
