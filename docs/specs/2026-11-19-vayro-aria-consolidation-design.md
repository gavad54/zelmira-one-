# معماری کاربردی نهایی VAYRO و بازطراحی ARIA
- تاریخ: 2026-11-19
- وضعیت: تصمیم معماری مالک؛ پیاده‌سازی و انتشار مرحله‌ای و evidence-gated
- دامنه: ساختار پنج اپ مستقل و طراحی کاربردی ARIA
- این سند مجوز merge، deploy، تغییر production، مهاجرت داده، پرداخت یا انتشار عمومی نیست.

## 1. سلسله‌مراتب قطعی
VAYRO اپلیکیشن مادر و مالک اکوسیستم است. پنج اپلیکیشن مستقل، هرکدام مستقیماً زیرمجموعه VAYRO هستند:

1. DANA — اپلیکیشن مستقل مرکز فرماندهی کل اکوسیستم.
2. ARIA — اپلیکیشن مستقل هوش مصنوعی، ارتباطات، محتوا، خدمات و فضای کار دیجیتال؛ مقصد قابلیت‌های اپ‌های قدیمی مشمول ادغام.
3. ARIANA — اپلیکیشن مستقل حسابداری، مالی و ERP و تنها مرجع این حوزه.
4. LEADORA — اپلیکیشن مستقل توزیع، فروش، موجودی و عملیات تجاری.
5. ARMIN MARKET — اپلیکیشن مستقل بازارگاه درخواست خریدار، استعلام و پیشنهاد تأمین‌کننده.

```text
VAYRO
├── DANA
├── ARIA
├── ARIANA
├── LEADORA
└── ARMIN MARKET
```

DANA والد سایر اپ‌ها نیست؛ مرکز فرماندهی است. ARIA والد ARIANA، LEADORA یا ARMIN MARKET نیست. این چهار اپ در ARIA ادغام نمی‌شوند: DANA، ARIANA، LEADORA و ARMIN MARKET.

## 2. مقصد اپلیکیشن‌های قدیمی
- ARIA قبلی: هسته محصول و قابلیت‌های موجود حفظ شود.
- ARVAND: ماژول تجارت و بازرگانی ARIA.
- CHARSU: قابلیت‌های کشف بازار و تجارت ARIA؛ بازارگاه مستقل ARMIN MARKET جدا می‌ماند.
- GANJINEH: ابزارهای فروشگاه دیجیتال ARIA.
- NEGAH: استودیوی خلاقیت ARIA.
- SEPEHR: ابزارهای ابری و مدیریت منابع ARIA با کنترل‌های سخت‌گیرانه برای عملیات privileged.
- NAMA: سایت‌ساز و صفحه‌ساز ARIA.
- PAYAM: بازاریابی و ارتباط با مخاطب ARIA با رضایت و اتصال مجاز.
- هر اپ تاریخی دیگر فقط پس از کشف منبع و تعیین مقصد وارد ماتریس می‌شود؛ نام حدسی پذیرفته نیست.

تعداد تاریخی یازده یا دوازده اپ هنوز کامل reconcile نشده است. موارد فاقد منبع با SOURCE_NOT_LOCATED ثبت می‌شوند.

## 3. طراحی کاربردی ARIA
ARIA باید یک محیط کار هوشمند و modular monolith مستقل باشد؛ تجربه کاربر واحد، ماژول‌های دامنه‌ای روشن، قرارداد داخلی، رجیستری نسخه‌دار و تست مستقل برای هر قابلیت.

دامنه‌های اصلی:
- ورودی هوشمند، فضای کار، تاریخچه و مدیریت وظایف.
- AI Gateway و دستیارهای تخصصی با محدودیت هزینه، منبع، timeout، fallback روشن و تأیید انسانی.
- مدیریت دانش و اسناد خصوصی، جست‌وجو، استخراج، ارجاع و retention.
- استودیوی متن، تصویر، صوت و ویدئو؛ فقط providerهای تأییدشده فعال تلقی می‌شوند.
- سایت‌ساز: draft، edit، preview، approval، publish و rollback.
- داده و گزارش: import، validation، dedup preview، analysis و source trace.
- workflow automation با queue، idempotency، retry محدود، dead-letter و audit.
- خدمات و جامعه با پروفایل، درخواست، تطبیق و گزارش تخلف.
- ابزارهای یادگیری و بهره‌وری شخصی با حفاظت ویژه از داده حساس.
- رشد کسب‌وکار و درآمد دیجیتال؛ بدون دفترکل حسابداری یا ERP.

## 4. گردش‌کار اصلی
درخواست طبیعی کاربر → طبقه‌بندی هدف → پیشنهاد مسیر → نمایش وضعیت واقعی قابلیت و هزینه احتمالی → رضایت برای پردازش پولی → تولید پیش‌نویس → بازبینی و اصلاح → ذخیره خصوصی → تأیید کاربر برای انتشار/ارسال بیرونی → ثبت نتیجه و مصرف.

هیچ انتشار عمومی، پیام انبوه، پرداخت، خرید یا اقدام برگشت‌ناپذیر بدون مجوز و تأیید صریح انجام نمی‌شود.

## 5. مرزهای فنی و داده
- هر پنج اپ منبع، داده، مجوز، runtime، secret، backup و release مستقل دارند.
- ارتباط بین اپ‌ها فقط از API/event نسخه‌دار و service identity با حداقل دسترسی است.
- هیچ اپی به جداول خصوصی اپ دیگر دسترسی مستقیم ندارد.
- قطع DANA نباید عملیات اصلی چهار اپ دیگر را متوقف کند.
- حسابداری/ERP فقط در ARIANA؛ عملیات توزیع در LEADORA؛ بازارگاه مستقل در ARMIN MARKET.
- انتقال داده مستلزم mapping، backup مستقل، dry run، integrity check و rollback/forward-repair است.

## 6. شواهد فعلی و محدودیت‌ها
در مخزن aria-android، کاتالوگ وب در main SHA 350a05a7e80189df4b24359d03ed1c0fc7e7f178 شامل ۶۵ رکورد است: ۲ foundation، ۵ prototype و ۵۸ planned. این کاتالوگ، رجیستری کامل Android 32 نیست. گزارش‌های ۳۶۹، ۶۳۹ و ۵۰ ایده مربوط به نسخه‌ها/منابع متفاوت‌اند و نباید جمع زده شوند. سورس کامل Android هنوز در مخزن نیست و checksumهای آرشیو باید از منبع تأییدشده مالک تطبیق داده شوند.

## 7. برنامه تحویل
1. تکمیل inventory همه مخازن/فایل‌ها و reconcile عدد تاریخی اپ‌ها.
2. تأیید provenance آرشیو Android و استخراج registry.
3. تطبیق وب و Android بر اساس ID و semantics و ایجاد canonical registry.
4. تکمیل هر قابلیت در یک workflow انتهابه‌انتها، با تست و evidence.
5. تکمیل امنیت، هویت، tenant isolation، audit، backup/restore و اقتصاد مصرف.
6. آزمون sandbox، UAT و device acceptance.
7. انتشار فقط پس از عبور release gates و تأیید صریح مالک.

## 8. منابع پیگیری
- ARIA functional redesign: https://github.com/gavad54/aria-android/blob/engineering/aria-functional-redesign-2026-11-19/docs/ARIA_FUNCTIONAL_REDESIGN_2026-11-19_FA.md
- ARIA source inventory: https://github.com/gavad54/aria-android/blob/engineering/aria-functional-redesign-2026-11-19/docs/ARIA_LEGACY_CAPABILITY_INVENTORY_2026-11-19_FA.md
- Product boundaries: ../PRODUCT-BOUNDARIES.md
- ADR-0002: ../architecture/ADR-0002-four-independent-apps-under-dana.md
