# شواهد مهندسی خانواده VAYRO — 2026-11-27

این snapshot فقط بر اساس خواندن زنده GitHub، Railway و Supabase تهیه شده است. هیچ secret، مقدار متغیر محرمانه، داده، schema، policy، تنظیم Production یا deployment تغییر داده نشد.

## 1) GitHub — PRهای مرجع و SHA دقیق

| محصول | PR | وضعیت | Base | Head SHA | فایل تغییرکرده | نتیجه CI روی Head |
|---|---:|---|---|---|---:|---|
| VAYRO | [#47](https://github.com/gavad54/zelmira-one-/pull/47) | MERGED، 2026-11-26 | main | `479f144962ce16c98ce22d44b84bc5005d964652` | 76 | VAYRO CI، CodeQL، lockfile validation همگی PASS |
| ARIA | [#3](https://github.com/gavad54/aria-android/pull/3) | OPEN / DRAFT | `engineering/aria-functional-redesign-2026-11-19` | `392c55d981af5a9ff2eccf01c68ecce256d28459` | 356 | ARIA CI، Web Catalog CI، CodeQL همگی PASS |
| ARIANA | [#1](https://github.com/gavad54/ARIANA/pull/1) | OPEN / DRAFT | main | `b0b80c8f7bf595961c4a7aaeb51216c5d1ab6852` | 12 | ARIANA CI و CodeQL هر دو PASS |
| LEADORA | [#54](https://github.com/gavad54/LEADORA/pull/54) | OPEN / DRAFT | main | `a45c750ecda9579ef0a31c4fb50e95bafd31c0e8` | 13 | CI، regression/security، Android test APK و CodeQL همگی PASS |
| ARMIN MARKET | [#2](https://github.com/gavad54/Armin_market/pull/2) | OPEN / DRAFT | main | `4101cffa36a26b42625928c9f7c99318f76f1d0a` | 12 | CodeQL PASS؛ Android build job PASS؛ Dependency Review FAIL |

SHAهای فعلی شاخه اصلی در زمان این ممیزی:
- VAYRO: `527db3a8051c3eef15c974c43ded4b6e755a75b3`
- ARIA: `0415e32ecaebcaa71d7d8753963a9eddcfbbeb69`
- ARIANA: `4f042b0a04a5d855f437fac26078b7c605ae1f81`
- LEADORA: `7bfebf39766cc5fbdf135489eb0d6127f6ae4e2c`
- ARMIN MARKET: `79176682f8daedb7a5f9ea8d55ec349f5aea9fc5`

VAYRO PR #47 ادغام شده است؛ این ادغام به حساب مالک GitHub ثبت شده، نه عامل این ممیزی. PR #59 مستندات زنده همچنان OPEN / DRAFT است و روی Head `6a52de510a3af0afa6dede6fcd3304d79a307524`، VAYRO CI و CodeQL هر دو PASS شده‌اند: [PR #59](https://github.com/gavad54/zelmira-one-/pull/59).

## 2) VAYRO main — وضعیت Checkها و Backup

روی SHA دقیق main یعنی `527db3a8051c3eef15c974c43ded4b6e755a75b3`:
- `validate`: PASS.
- `Analyze JavaScript and TypeScript` (CodeQL): PASS.
- `Dump, encrypt and upload private backup`: FAIL در مرحله اعتبارسنجی پیکربندی محافظت‌شده.

به علت نبود پیکربندی محافظت‌شده لازم، مراحل dump، رمزگذاری و upload اجرا نشده‌اند؛ تعداد artifactهای تولیدشده صفر است. بنابراین **هیچ Backup مستقل تأییدشده‌ای وجود ندارد** و Restore Drill نیز اثبات نشده است. این مورد `WAITING_FOR_OWNER` است؛ هیچ مقدار محرمانه‌ای در این گزارش ثبت نشده است.

[اجرای ناموفق Backup روی SHA دقیق main](https://github.com/gavad54/zelmira-one-/actions/runs/45805286510)

## 3) تغییرات و تفاوت‌های مهم نسبت به snapshot قبلی

- ARMIN MARKET: در اجرای دقیق Head فعلی، Job ساخت APK موفق است؛ شکست مربوط به Job جداگانه Dependency Review است که به‌دلیل غیرفعال بودن Dependency Graph مخزن اجرا نمی‌شود. این خطا اثبات آسیب‌پذیری وابستگی نیست. [اجرای CI](https://github.com/gavad54/Armin_market/actions/runs/45592931348)
- LEADORA: فایل CI در Head فعلی هر دو فایل `compose.yaml` و `docker-compose.yml` را جداگانه اعتبارسنجی می‌کند؛ هر دو در CI سبز فعلی بررسی می‌شوند. APK تولیدی Debug/Test است و انتشار تجاری یا نصب روی دستگاه واقعی را اثبات نمی‌کند.
- ARIA: مخزن فعلی هنوز شواهد APK قابل نصب و اجرای دستگاه واقعی ندارد؛ CI وب/Node جایگزین آزمون Android نیست.
- ARIANA: مخزن مستقل هنوز scaffold امنیت JWT است؛ آرشیو کامل برنامه و آزمون کامل برنامه به این مخزن وارد نشده است.
- VAYRO: PR #59 اکنون CI و CodeQL موفق دارد؛ اما Backup واقعی هنوز به علت پیکربندی محافظت‌شده اجرا نشده است.

## 4) Railway — فقط خواندنی

فقط دو پروژه در دسترس‌اند: `ARIA Web` و `LEADORA`. پروژه مستقل VAYRO مشاهده نشد.

- سرویس VAYRO در ARIA Web: OFFLINE، بدون replica فعال و بدون Volume متصل. آخرین deployment ثبت‌شده FAILED است؛ build موفق بوده ولی healthcheck مسیر `/api/health` هشت بار HTTP 503 دریافت کرده و replica سالم نشده است. این deployment قدیمی است و نباید به‌عنوان وضعیت commit فعلی تلقی شود.
- در ARIA Web یک patch با سه تغییر STAGED وجود دارد که سرویس جدیدی از شاخه `brand/vayro-name-only` و commit `6602c54eea9312589129b79304c38e25c9d338c4` می‌سازد. این سرویس هنوز LIVE نیست؛ patch اعمال نشد.
- پروژه LEADORA: سرویس‌های VAYRO و `leadora-web` هر دو OFFLINE و بدون replica فعال‌اند. Volume پانصد مگابایتی `/data` فقط به سرویس LEADORA متصل است.
- HTTP metrics در ۲۴ ساعت گذشته برای سرویس‌های بررسی‌شده صفر است. بررسی بیرونی health URLها از ابزار وب قابل دسترسی نبود؛ بنابراین HTTP خارجی `UNVERIFIED` است.
- Webhookهای مشاهده‌شده صفرند. Monitorها `UNVERIFIED` هستند، چون قابلیت Railway Automations برای این اتصال فعال نیست.

هیچ staged change، deploy، restart، variable، volume یا تنظیم Production تغییر داده نشد.

## 5) Supabase VAYRO-CORE — فقط خواندنی

Project `wdqhdnhpgxhmmfeyxwxr`:
- وضعیت `ACTIVE_HEALTHY`، PostgreSQL `17.11`.
- migration history خالی است: صفر migration ثبت‌شده.
- ۱۱ جدول عمومی مشاهده شد؛ همه RLS فعال دارند، اما هیچ‌کدام policy ندارند.
- هر ۱۱ جدول در شمارش فعلی صفر ردیف دارند.
- Security Advisor: یازده هشدار RLS بدون Policy.
- Performance Advisor: ده هشدار unused index.
- Health Advisor: بدون یافته.

RLS فعال بدون Policy به‌تنهایی اثبات جداسازی tenant نیست. هیچ SQL نوشتنی، DDL، migration، grant، policy یا تغییر داده اجرا نشد.

## 6) Runtime و تصمیم عملیاتی

کد Worker و Scheduler در مخزن VAYRO وجود دارد و CI روی محیط ایزوله برخی مرزهای نقش، صف، retry و recovery را می‌آزماید؛ اما در Railway هیچ Worker/Scheduler زنده‌ای مشاهده نشد. اجرای بین مکالمه‌ها، restart recovery در محیط مستقر و خودگردانی دائمی اثبات نشده است.

**تصمیم:** انتشار و migration زنده همچنان BLOCKED است. گیت‌های باز اصلی: پیکربندی امن Backup و artifact خارج از میزبان، Restore مستقل با invariant PASS، baseline و drift reconciliation روی clone، نقش‌ها و Policyهای RLS با مجوز جداگانه، میزبانی مستقل VAYRO و استقرار Worker/Scheduler. هیچ PR ادغام یا Production تغییر داده نشد.
