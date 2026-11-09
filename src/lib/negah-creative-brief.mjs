const clean = value => value.trim().replace(/\s+/g, " ");

const FORMATS = new Set(["instagram-post","instagram-story","youtube-thumbnail","product-photo","ad-banner","logo-concept","brand-kit"]);

export function validateCreativeBrief(input) {
  if (!input || typeof input !== "object") return { valid: false, error: "invalid_input" };
  for (const key of ["project","format","audience","message","style"]) {
    if (typeof input[key] !== "string" || input[key].trim().length < 2 || input[key].length > 1000) {
      return { valid: false, error: "invalid_" + key };
    }
  }
  if (!FORMATS.has(input.format)) return { valid: false, error: "invalid_format" };
  for (const key of ["brandColors","requiredElements","avoid"]) {
    if (input[key] !== undefined && (typeof input[key] !== "string" || input[key].length > 1200)) {
      return { valid: false, error: "invalid_" + key };
    }
  }
  return { valid: true };
}

export function buildCreativeBrief(input) {
  const labels = {
    "instagram-post": "پست اینستاگرام · ۱۰۸۰×۱۰۸۰",
    "instagram-story": "استوری عمودی · ۱۰۸۰×۱۹۲۰",
    "youtube-thumbnail": "تامبنیل یوتیوب · ۱۲۸۰×۷۲۰",
    "product-photo": "تصویر محصول · مربع با فضای امن برش",
    "ad-banner": "بنر تبلیغاتی · نسخه‌پذیر برای چند نسبت تصویر",
    "logo-concept": "مفهوم اولیه لوگو · نسخه برداری‌پذیر",
    "brand-kit": "کیت هویت بصری · اجزای سازگار"
  };
  const value = key => clean(input[key] ?? "");
  const sections = [
    ["شرح پروژه", value("project")],
    ["قالب و مشخصات", labels[input.format]],
    ["مخاطب هدف", value("audience")],
    ["پیام اصلی", value("message")],
    ["جهت هنری", value("style")],
    ["رنگ‌های برند", value("brandColors") || "مطابق هویت برند؛ در صورت نبود راهنما پیشنهاد ارائه شود."],
    ["عناصر ضروری", value("requiredElements") || "پس از دریافت دارایی‌های مجاز تعیین شود."],
    ["موارد ممنوع", value("avoid") || "از عناصر گمراه‌کننده، نشان تجاری بدون مجوز و ادعاهای اثبات‌نشده پرهیز شود."],
    ["کنترل حقوق و کیفیت", "فقط از تصاویر، فونت‌ها و علائم دارای مجوز یا متعلق به سفارش‌دهنده استفاده شود. متن نهایی، خوانایی، کنتراست و حاشیه امن پیش از خروجی بررسی شود."],
    ["خروجی تحویلی", "نسخه اصلی، نسخه پیش‌نمایش، مشخصات ابعاد و فهرست دارایی‌های استفاده‌شده."]
  ];
  return sections.map(([heading, body]) => heading + ":\n" + body).join("\n\n");
}
