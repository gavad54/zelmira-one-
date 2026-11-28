import { assertProductFamilyContract } from "./product-family-contract.mjs";

export const VAYRO_PRODUCTS = Object.freeze([
  { name: "DANA", fa: "دانا", detail: "مرکز فرماندهی مستقل VAYRO، تحلیل و هماهنگی کنترل‌شده", tag: "مرکز فرماندهی", status: "ممیزی و انتشار مستقل لازم است", statusClass: "blocked", href: "/dana/ai-workspace" },
  { name: "ARIANA", fa: "آریانا", detail: "حسابداری، مالی، مالیات، بودجه و ERP", tag: "مالی و ERP", status: "ممیزی و انتشار مستقل لازم است", statusClass: "blocked" },
  { name: "LEADORA", fa: "لیدورا", detail: "توزیع، فروش و عملیات تجاری مستقل", tag: "توزیع و فروش", status: "نسخه موجود؛ انتشار نهایی مسدود", statusClass: "blocked" },
  { name: "ARMIN MARKET", fa: "آرمین مارکت", detail: "بازارگاه مستقل خریداران و تأمین‌کنندگان", tag: "بازارگاه", status: "ممیزی و انتشار مستقل لازم است", statusClass: "blocked" },
  { name: "ARIA", fa: "آریا", detail: "جامعه، خدمات و کسب‌وکار؛ شامل هفت ماژول قدیمی و بدون حسابداری و ERP", tag: "خدمات و کسب‌وکار", status: "ممیزی و انتشار مستقل لازم است", statusClass: "blocked" }
]);

export const ARIA_MODULES = Object.freeze([
  { name: "ARVAND", fa: "اروند", detail: "تجارت بین‌الملل، صادرات و واردات", ownerProduct: "ARIA", legacyKey: "ARVAND" },
  { name: "CHARSU", fa: "چهارسو", detail: "بازارگاه و شبکه خریدوفروش", ownerProduct: "ARIA", legacyKey: "CHARSU" },
  { name: "GANJINEH", fa: "گنجینه", detail: "فروشگاه و تجارت الکترونیک", ownerProduct: "ARIA", legacyKey: "GANJINEH" },
  { name: "NEGAH", fa: "نگاه", detail: "استودیو خلاقیت و تولید محتوا", ownerProduct: "ARIA", legacyKey: "NEGAH" },
  { name: "SEPEHR", fa: "سپهر", detail: "زیرساخت ابری و خدمات فناوری", ownerProduct: "ARIA", legacyKey: "SEPEHR" },
  { name: "NAMA", fa: "نما", detail: "ساخت وب‌سایت و صفحات فرود", ownerProduct: "ARIA", legacyKey: "NAMA" },
  { name: "PAYAM", fa: "پیام", detail: "بازاریابی و توسعه مشتری", ownerProduct: "ARIA", legacyKey: "PAYAM" }
]);

// Deprecated compatibility alias. These are no longer independent products.
export const INDEPENDENT_PRODUCTS = VAYRO_PRODUCTS;
export const VAYRO_CAPABILITIES = Object.freeze([]);
export const ALL_PRODUCTS = VAYRO_PRODUCTS;
export const ALL_PRODUCT_MODULES = Object.freeze([...VAYRO_PRODUCTS, ...ARIA_MODULES]);

assertProductFamilyContract({ VAYRO_PRODUCTS, ARIA_MODULES, VAYRO_CAPABILITIES });
