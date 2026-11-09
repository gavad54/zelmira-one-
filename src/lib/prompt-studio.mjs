const clean = value => value.trim().replace(/\s+/g, " ");

export function buildBusinessPrompt(input) {
  const business = clean(input.business);
  const goal = clean(input.goal);
  const audience = clean(input.audience);
  const tone = clean(input.tone);
  const context = clean(input.context ?? "");
  const constraints = clean(input.constraints ?? "");
  const outputFormat = clean(input.outputFormat);

  return [
    "نقش و تخصص:",
    `در نقش متخصص حرفه‌ای حوزه «${business}» عمل کن و پاسخ را بر اساس دانش معتبر و قابل‌بررسی ارائه بده.`,
    "",
    "هدف:",
    goal,
    "",
    "مخاطب هدف:",
    audience,
    "",
    "لحن و سبک:",
    tone,
    "",
    "زمینه و اطلاعات تکمیلی:",
    context || "اطلاعات تکمیلی ارائه نشده است؛ پیش از فرض‌سازی، ابهام‌های مهم را مشخص کن.",
    "",
    "محدودیت‌ها و معیارهای کیفیت:",
    constraints || "از ادعاهای بدون پشتوانه، اطلاعات ساختگی و نتیجه‌گیری قطعی بدون شواهد خودداری کن.",
    "",
    "قالب خروجی:",
    outputFormat,
    "",
    "کنترل نهایی:",
    "پیش از ارائه پاسخ، کامل‌بودن، سازگاری با هدف، صحت اطلاعات و رعایت محدودیت‌ها را بررسی کن. موارد نامطمئن را صریحاً مشخص کن."
  ].join("\n");
}

export function validateBusinessPromptInput(input) {
  if (!input || typeof input !== "object") return { valid: false, error: "invalid_input" };
  const fields = ["business", "goal", "audience", "tone", "outputFormat"];
  for (const field of fields) {
    if (typeof input[field] !== "string" || input[field].trim().length < 2 || input[field].length > 1200) {
      return { valid: false, error: "invalid_" + field };
    }
  }
  for (const field of ["context", "constraints"]) {
    if (input[field] !== undefined && (typeof input[field] !== "string" || input[field].length > 3000)) {
      return { valid: false, error: "invalid_" + field };
    }
  }
  return { valid: true };
}
