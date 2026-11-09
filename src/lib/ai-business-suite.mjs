/**
 * Canonical VAYRO AI Business Suite capability registry.
 * This registry describes product ownership and monetization; PLANNED means
 * no production provider or workflow is implied to exist.
 */
export const AI_BUSINESS_CAPABILITIES = Object.freeze([
  {
    "number": 1,
    "key": "instagram-cover",
    "title": "ساخت کاور اینستاگرام",
    "product": "NEGAH",
    "engine": "image",
    "revenue": "asset_credit",
    "availability": "PLANNED"
  },
  {
    "number": 2,
    "key": "photo-retouch",
    "title": "ادیت و روتوش عکس",
    "product": "NEGAH",
    "engine": "image",
    "revenue": "per_image_credit",
    "availability": "PLANNED"
  },
  {
    "number": 3,
    "key": "professional-profile-photo",
    "title": "ساخت عکس پروفایل حرفه‌ای",
    "product": "NEGAH",
    "engine": "image",
    "revenue": "package_sale",
    "availability": "PLANNED"
  },
  {
    "number": 4,
    "key": "product-photography",
    "title": "ساخت عکس محصول",
    "product": "GANJINEH",
    "engine": "image",
    "revenue": "per_image_credit",
    "availability": "PLANNED"
  },
  {
    "number": 5,
    "key": "virtual-clothing-preview",
    "title": "تعویض مجازی لباس",
    "product": "NEGAH",
    "engine": "image",
    "revenue": "per_image_credit",
    "availability": "PLANNED"
  },
  {
    "number": 6,
    "key": "ad-banner",
    "title": "ساخت بنر تبلیغاتی",
    "product": "NEGAH",
    "engine": "image",
    "revenue": "design_package",
    "availability": "PLANNED"
  },
  {
    "number": 7,
    "key": "social-post-story",
    "title": "طراحی پست و استوری",
    "product": "NEGAH",
    "engine": "image",
    "revenue": "studio_subscription",
    "availability": "PLANNED"
  },
  {
    "number": 8,
    "key": "youtube-thumbnail",
    "title": "ساخت تامبنیل یوتیوب",
    "product": "NEGAH",
    "engine": "image",
    "revenue": "design_package",
    "availability": "PLANNED"
  },
  {
    "number": 9,
    "key": "faceless-reels",
    "title": "ساخت ریلز بدون چهره",
    "product": "NEGAH",
    "engine": "video",
    "revenue": "per_video_credit",
    "availability": "PLANNED"
  },
  {
    "number": 10,
    "key": "ai-avatar",
    "title": "ساخت آواتار با AI",
    "product": "NEGAH",
    "engine": "image",
    "revenue": "package_sale",
    "availability": "PLANNED"
  },
  {
    "number": 11,
    "key": "talking-avatar-video",
    "title": "ساخت ویدئوی سخنگو",
    "product": "NEGAH",
    "engine": "video",
    "revenue": "per_video_credit",
    "availability": "PLANNED"
  },
  {
    "number": 12,
    "key": "video-subtitles",
    "title": "زیرنویس و کپشن ویدئو",
    "product": "NEGAH",
    "engine": "media",
    "revenue": "per_minute",
    "availability": "PLANNED"
  },
  {
    "number": 13,
    "key": "text-to-video",
    "title": "تبدیل متن به ویدئو",
    "product": "NEGAH",
    "engine": "video",
    "revenue": "per_video_credit",
    "availability": "PLANNED"
  },
  {
    "number": 14,
    "key": "podcast-clips",
    "title": "کلیپ‌سازی از پادکست",
    "product": "NEGAH",
    "engine": "media",
    "revenue": "studio_subscription",
    "availability": "PLANNED"
  },
  {
    "number": 15,
    "key": "product-ad-video",
    "title": "ساخت ویدئوی تبلیغ محصول",
    "product": "NEGAH",
    "engine": "video",
    "revenue": "project_sale",
    "availability": "PLANNED"
  },
  {
    "number": 16,
    "key": "ai-logo",
    "title": "طراحی لوگو با AI",
    "product": "NEGAH",
    "engine": "image",
    "revenue": "brand_package",
    "availability": "PLANNED"
  },
  {
    "number": 17,
    "key": "product-packaging",
    "title": "طراحی بسته‌بندی محصول",
    "product": "NEGAH",
    "engine": "image",
    "revenue": "project_sale",
    "availability": "PLANNED"
  },
  {
    "number": 18,
    "key": "product-catalog",
    "title": "ساخت کاتالوگ حرفه‌ای",
    "product": "GANJINEH",
    "engine": "document",
    "revenue": "catalog_subscription",
    "availability": "PLANNED"
  },
  {
    "number": 19,
    "key": "ad-mockup",
    "title": "ساخت موکاپ تبلیغاتی",
    "product": "NEGAH",
    "engine": "image",
    "revenue": "asset_credit",
    "availability": "PLANNED"
  },
  {
    "number": 20,
    "key": "character-design",
    "title": "طراحی کاراکتر با AI",
    "product": "NEGAH",
    "engine": "image",
    "revenue": "license_sale",
    "availability": "PLANNED"
  },
  {
    "number": 21,
    "key": "business-prompt-studio",
    "title": "پرامپت‌نویسی کسب‌وکار",
    "product": "DANA",
    "engine": "writing",
    "revenue": "template_subscription",
    "availability": "PLANNED"
  },
  {
    "number": 22,
    "key": "prompt-marketplace",
    "title": "ساخت و فروش پک پرامپت",
    "product": "CHARSU",
    "engine": "marketplace",
    "revenue": "transaction_commission",
    "availability": "PLANNED"
  },
  {
    "number": 23,
    "key": "instagram-caption",
    "title": "نوشتن کپشن اینستاگرام",
    "product": "PAYAM",
    "engine": "writing",
    "revenue": "text_credit",
    "availability": "PLANNED"
  },
  {
    "number": 24,
    "key": "short-video-script",
    "title": "سناریونویسی ریلز",
    "product": "PAYAM",
    "engine": "writing",
    "revenue": "content_package",
    "availability": "PLANNED"
  },
  {
    "number": 25,
    "key": "content-ideation",
    "title": "ایده‌پردازی محتوایی",
    "product": "PAYAM",
    "engine": "writing",
    "revenue": "marketing_subscription",
    "availability": "PLANNED"
  },
  {
    "number": 26,
    "key": "ad-copy-rewrite",
    "title": "بازنویسی متن تبلیغاتی",
    "product": "PAYAM",
    "engine": "writing",
    "revenue": "text_credit",
    "availability": "PLANNED"
  },
  {
    "number": 27,
    "key": "content-calendar",
    "title": "ساخت تقویم محتوایی",
    "product": "PAYAM",
    "engine": "planning",
    "revenue": "marketing_subscription",
    "availability": "PLANNED"
  },
  {
    "number": 28,
    "key": "ai-content-management",
    "title": "مدیریت محتوا با AI",
    "product": "PAYAM",
    "engine": "workflow",
    "revenue": "marketing_subscription",
    "availability": "PLANNED"
  },
  {
    "number": 29,
    "key": "resume-portfolio",
    "title": "ساخت رزومه و پورتفولیو",
    "product": "NAMA",
    "engine": "document",
    "revenue": "template_sale",
    "availability": "PLANNED"
  },
  {
    "number": 30,
    "key": "specialist-translation",
    "title": "ترجمه و بازنویسی تخصصی",
    "product": "ARVAND",
    "engine": "translation",
    "revenue": "per_document",
    "availability": "PLANNED"
  },
  {
    "number": 31,
    "key": "pdf-summary",
    "title": "خلاصه‌سازی PDF و مقاله",
    "product": "DANA",
    "engine": "document",
    "revenue": "per_page_credit",
    "availability": "PLANNED"
  },
  {
    "number": 32,
    "key": "learning-content",
    "title": "ساخت محتوای آموزشی",
    "product": "NEGAH",
    "engine": "writing",
    "revenue": "course_package",
    "availability": "PLANNED"
  },
  {
    "number": 33,
    "key": "quiz-flashcards",
    "title": "ساخت آزمون و فلش‌کارت",
    "product": "DANA",
    "engine": "learning",
    "revenue": "learning_subscription",
    "availability": "PLANNED"
  },
  {
    "number": 34,
    "key": "ai-tools-training",
    "title": "آموزش ابزارهای هوش مصنوعی",
    "product": "DANA",
    "engine": "learning",
    "revenue": "course_sale",
    "availability": "PLANNED"
  },
  {
    "number": 35,
    "key": "ai-chatbot",
    "title": "ساخت چت‌بات پاسخ‌گو",
    "product": "DANA",
    "engine": "agent",
    "revenue": "per_agent_subscription",
    "availability": "PLANNED"
  },
  {
    "number": 36,
    "key": "support-automation",
    "title": "اتوماسیون پشتیبانی مشتری",
    "product": "DANA",
    "engine": "agent",
    "revenue": "organization_subscription",
    "availability": "PLANNED"
  },
  {
    "number": 37,
    "key": "ai-sales-assistant",
    "title": "ساخت دستیار فروش AI",
    "product": "DANA",
    "engine": "agent",
    "revenue": "subscription_plus_usage",
    "availability": "PLANNED"
  },
  {
    "number": 38,
    "key": "smart-faq",
    "title": "ساخت FAQ هوشمند",
    "product": "DANA",
    "engine": "knowledge",
    "revenue": "knowledge_subscription",
    "availability": "PLANNED"
  },
  {
    "number": 39,
    "key": "ai-data-analysis",
    "title": "تحلیل داده با AI",
    "product": "DANA",
    "engine": "analytics",
    "revenue": "per_analysis",
    "availability": "PLANNED"
  },
  {
    "number": 40,
    "key": "reports-dashboard",
    "title": "ساخت گزارش و داشبورد",
    "product": "DANA",
    "engine": "analytics",
    "revenue": "dashboard_subscription",
    "availability": "PLANNED"
  },
  {
    "number": 41,
    "key": "data-cleanup",
    "title": "پاک‌سازی و مرتب‌سازی داده",
    "product": "DANA",
    "engine": "data",
    "revenue": "per_dataset",
    "availability": "PLANNED"
  },
  {
    "number": 42,
    "key": "no-code-website",
    "title": "ساخت سایت بدون کدنویسی",
    "product": "NAMA",
    "engine": "builder",
    "revenue": "builder_subscription",
    "availability": "PLANNED"
  },
  {
    "number": 43,
    "key": "landing-page",
    "title": "ساخت لندینگ‌پیج",
    "product": "NAMA",
    "engine": "builder",
    "revenue": "per_published_site",
    "availability": "PLANNED"
  },
  {
    "number": 44,
    "key": "no-code-app",
    "title": "ساخت اپلیکیشن No-Code",
    "product": "NAMA",
    "engine": "builder",
    "revenue": "builder_plus_runtime",
    "availability": "PLANNED"
  },
  {
    "number": 45,
    "key": "ai-seo",
    "title": "سئو با کمک AI",
    "product": "PAYAM",
    "engine": "marketing",
    "revenue": "growth_subscription",
    "availability": "PLANNED"
  },
  {
    "number": 46,
    "key": "product-description",
    "title": "نوشتن توضیحات محصول",
    "product": "GANJINEH",
    "engine": "writing",
    "revenue": "text_credit",
    "availability": "PLANNED"
  },
  {
    "number": 47,
    "key": "ebook-digital-file",
    "title": "ساخت ایبوک و فایل دیجیتال",
    "product": "NEGAH",
    "engine": "document",
    "revenue": "asset_sale",
    "availability": "PLANNED"
  },
  {
    "number": 48,
    "key": "ai-voice-content",
    "title": "ساخت محتوای صوتی با صدای AI",
    "product": "NEGAH",
    "engine": "audio",
    "revenue": "per_audio_minute",
    "availability": "PLANNED"
  },
  {
    "number": 49,
    "key": "photo-restoration",
    "title": "ترمیم عکس‌های قدیمی",
    "product": "NEGAH",
    "engine": "image",
    "revenue": "per_image_credit",
    "availability": "PLANNED"
  },
  {
    "number": 50,
    "key": "ai-workflow-builder",
    "title": "طراحی ورک‌فلو و اتوماسیون AI",
    "product": "DANA",
    "engine": "workflow",
    "revenue": "per_execution_plus_subscription",
    "availability": "PLANNED"
  }
].map(item => Object.freeze(item)));

export const AI_ENGINE_KEYS = Object.freeze([
  "image", "video", "audio", "media", "writing", "document", "translation",
  "planning", "workflow", "marketplace", "agent", "knowledge", "analytics",
  "learning", "data", "builder", "marketing"
]);

const PRODUCTS = new Set(["ARVAND","CHARSU","GANJINEH","NEGAH","SEPEHR","NAMA","PAYAM","DANA"]);
const REVENUE_MODELS = new Set([
  "asset_credit","per_image_credit","package_sale","design_package","studio_subscription",
  "per_video_credit","per_minute","project_sale","brand_package","catalog_subscription",
  "license_sale","template_subscription","transaction_commission","text_credit",
  "content_package","marketing_subscription","template_sale","per_document","per_page_credit",
  "course_package","learning_subscription","course_sale","per_agent_subscription",
  "organization_subscription","subscription_plus_usage","knowledge_subscription","per_analysis",
  "dashboard_subscription","per_dataset","builder_subscription","per_published_site",
  "builder_plus_runtime","growth_subscription","asset_sale","per_audio_minute",
  "per_execution_plus_subscription"
]);

export function listAiBusinessCapabilities({ product, engine, includePlanned = true } = {}) {
  if (product !== undefined && !PRODUCTS.has(product)) return [];
  if (engine !== undefined && !AI_ENGINE_KEYS.includes(engine)) return [];
  return AI_BUSINESS_CAPABILITIES.filter(item =>
    (!product || item.product === product) &&
    (!engine || item.engine === engine) &&
    (includePlanned || item.availability !== "PLANNED")
  );
}

export function validateAiBusinessCapabilityRegistry(items = AI_BUSINESS_CAPABILITIES) {
  if (!Array.isArray(items) || items.length !== 50) return { valid: false, error: "capability_count_must_be_50" };
  const numbers = new Set();
  const keys = new Set();
  for (const item of items) {
    if (!Number.isInteger(item.number) || item.number < 1 || item.number > 50 || numbers.has(item.number)) {
      return { valid: false, error: "invalid_or_duplicate_number" };
    }
    if (typeof item.key !== "string" || !/^[a-z0-9-]{3,64}$/.test(item.key) || keys.has(item.key)) {
      return { valid: false, error: "invalid_or_duplicate_key" };
    }
    if (typeof item.title !== "string" || !item.title.trim() || !PRODUCTS.has(item.product) ||
        !AI_ENGINE_KEYS.includes(item.engine) || !REVENUE_MODELS.has(item.revenue) ||
        item.availability !== "PLANNED") {
      return { valid: false, error: "invalid_capability_definition" };
    }
    numbers.add(item.number);
    keys.add(item.key);
  }
  return { valid: true };
}
