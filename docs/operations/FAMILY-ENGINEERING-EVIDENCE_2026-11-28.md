# شواهد مهندسی خانواده VAYRO — 2026-11-28

> این سند فقط وضعیت مشاهده‌شده در 2026-11-28 را ثبت می‌کند. همه بررسی‌های Railway و Supabase فقط‌خواندنی بودند. هیچ Production deploy، merge، تغییر تنظیمات، تغییر داده/Schema، DNS یا اقدام مالی انجام نشد. مقدار Secretها خوانده یا ثبت نشده است.

## 1) GitHub — پنج مخزن مرجع

| محصول | PR مرجع | وضعیت PR | Base | Head | SHA کامل Head | فایل‌های PR | نتیجه دقیق Head |
|---|---:|---|---|---|---|---:|---|
| VAYRO | [#47](https://github.com/gavad54/zelmira-one-/pull/47) | Merged، 2026-11-26 | main | upgrade/full-independent-product-family-modules-2026-11-20 | `479f144962ce16c98ce22d44b84bc5005d964652` | 76 | VAYRO CI، CodeQL، Lockfile PASS |
| ARIA | [#3](https://github.com/gavad54/aria-android/pull/3) | Open / Draft | engineering/aria-functional-redesign-2026-11-19 | engineering/aria-preserve-all-capabilities-2026-11-19 | `392c55d981af5a9ff2eccf01c68ecce256d28459` | 356 | ARIA CI، Web Catalog CI، CodeQL PASS |
| ARIANA | [#1](https://github.com/gavad54/ARIANA/pull/1) | Open / Draft | main | engineering/ariana-v0.38-standalone-bootstrap | `b0b80c8f7bf595961c4a7aaeb51216c5d1ab6852` | 12 | ARIANA CI، CodeQL PASS |
| LEADORA | [#54](https://github.com/gavad54/LEADORA/pull/54) | Open / Draft | main | fix/disable-participation-contracts-2026-11-20 | `a45c750ecda9579ef0a31c4fb50e95bafd31c0e8` | 13 | CI، Regression/Security، Android Debug APK، CodeQL PASS |
| ARMIN MARKET | [#2](https://github.com/gavad54/Armin_market/pull/2) | Open / Draft | main | architecture/market-intelligence-integration-2026-11-19 | `0aec0115b09a7c04559117f60c7f5cb3ab15b160` | 12 | Build و CodeQL در حال اجرا؛ Dependency Review به‌علت غیرفعال بودن Dependency Graph شکست خورد |

### شاخه‌های اصلی و اختلاف با PRها

| مخزن | SHA شاخه main در زمان بررسی | وضعیت check-runs همان SHA |
|---|---|---|
| VAYRO | `527db3a8051c3eef15c974c43ded4b6e755a75b3` | CI و CodeQL موفق؛ دو اجرای Backup ناموفق |
| ARIA | `0415e32ecaebcaa71d7d8753963a9eddcfbbeb69` | یک check ناموفق در سابقه همان SHA؛ PR #3 روی Head خودش سبز است |
| ARIANA | `4f042b0a04a5d855f437fac26078b7c605ae1f81` | check-run ثبت‌شده: صفر |
| LEADORA | `7bfebf39766cc5fbdf135489eb0d6127f6ae4e2c` | یک موفق، چهار لغوشده |
| ARMIN MARKET | `79176682f8daedb7a5f9ea8d55ec349f5aea9fc5` | یک Build موفق قدیمی |

PRهای تکمیلی VAYRO:
- [PR #59 — شواهد و مستندات](https://github.com/gavad54/zelmira-one-/pull/59)، Open/Draft، Head `df0dab94c23d212d1bc020b4195bad51e5f49003`؛ CI و CodeQL PASS.
- [PR #63 — اعتبارسنجی خواندن مجدد Backup رمزگذاری‌شده](https://github.com/gavad54/zelmira-one-/pull/63)، Open/Draft، Head `a45da05755e08c7cf0817b3159b68a9a4ace88fa`؛ CI و CodeQL PASS. این PASSها آزمون مصنوعی و کد را تأیید می‌کنند، نه Backup یا Restore واقعی.

## 2) تغییر جدید ARMIN MARKET

PR #2 روی همان شاخه توسعه به‌روزرسانی شد:
- Commit نهایی: `0aec0115b09a7c04559117f60c7f5cb3ab15b160`
- Commit منطق محدودسازی Snapshot: `bcf5d094c0d9211d86d6d41e900bb77e91cd3d89`
- محدودیت Snapshot سبد محلی: 64 KiB و حداکثر 500 ردیف.
- سه آزمون جدید برای رد Snapshot بیش‌ازحد بزرگ، بیش از 500 ردیف در Decode و بیش از 500 ردیف در Encode.
- [Commit نهایی](https://github.com/gavad54/Armin_market/commit/0aec0115b09a7c04559117f60c7f5cb3ab15b160)

اجرای جدید:
- [Android APK Build](https://github.com/gavad54/Armin_market/actions/runs/46132816135) — در حال اجرا هنگام ثبت این سند؛ Job مربوط به Build در حال اجرا بود، Dependency Review به‌علت تنظیم مخزن شکست خورد.
- [CodeQL PR](https://github.com/gavad54/Armin_market/actions/runs/46132816158) — در حال اجرا.
- [CodeQL Push](https://github.com/gavad54/Armin_market/actions/runs/46132811371) — در حال اجرا.

آزمون محلی Gradle در این محیط اجرا نشد؛ نتیجه نهایی باید از CI روی همین SHA خوانده شود. Dependency Graph مخزن هنوز به اقدام مالک نیاز دارد. هیچ تنظیم GitHub تغییر نکرد.

## 3) Railway — فقط‌خواندنی

در حساب متصل فقط دو پروژه دیده شد: `ARIA Web` و `LEADORA`. پروژه مستقل VAYRO مشاهده نشد.

### ARIA Web / production
- Project ID: `c936dddd-5aa7-46d9-bd04-aa77f2164586`
- Environment ID: `468fda02-2199-4520-8c7e-6b589d3ceb0a`
- سرویس VAYRO موجود است؛ یک Replica پیکربندی‌شده، وضعیت Runtime برابر Offline.
- آخرین Deployment مشاهده‌شده: FAILED در Healthcheck؛ مسیر `/api/health` هشت بار HTTP 503 برگرداند.
- Domain پیکربندی‌شده: `vayro-production.up.railway.app`
- Volume متصل: صفر؛ نام متغیرهای محیطی برای این سرویس: صفر.
- HTTP metrics در پنجره 168 ساعته: صفر درخواست.
- یک Patch از 2026-11-05 با 3 تغییر هنوز STAGED است. یک سرویس با نام `aria-web-0868c44a-84c4-4127-8550-55cc0fd34a63` فقط staged-create است و LIVE نیست؛ منبع آن شاخه `brand/vayro-name-only` است.

### LEADORA / production
- Project ID: `806faa38-6cdd-4a6a-bad4-0e94cf6070fa`
- Environment ID: `c3587e3a-9ff5-4749-bd91-2afdda4d5f77`
- سرویس VAYRO: Offline؛ آخرین Deployment شکست‌خورده در مرحله BUILD_IMAGE بوده است. Log نشان می‌دهد پیکربندی لازم نقش دیتابیس Production حاضر نبوده؛ مقدار هیچ متغیر محرمانه‌ای خوانده نشده است.
- سرویس LEADORA Web: Offline و بدون Latest Deployment؛ Domain موجود است؛ Volume مستقل `leadora-data` با ظرفیت 500 MB روی `/data` متصل است.
- HTTP metrics هر دو سرویس در پنجره 168 ساعته: صفر درخواست.
- Staged changes: صفر.

در هر دو پروژه Webhook ثبت‌شده مشاهده نشد. فهرست Monitorها قابل دریافت نبود، چون Railway Automations برای اتصال فعلی فعال نیست؛ Monitor status برابر UNVERIFIED است. درخواست مستقیم HTTP به Domainها از ابزار وب قابل دریافت نبود؛ نتیجه خارجی UNVERIFIED است.

## 4) Supabase — VAYRO-CORE، فقط‌خواندنی

- Project: `wdqhdnhpgxhmmfeyxwxr`
- Status: ACTIVE_HEALTHY
- PostgreSQL: 17.11
- Migration history زنده: صفر
- جدول‌های `public`: 11؛ هر 11 جدول RLS فعال دارند؛ شمار ردیف گزارش‌شده برای همه صفر است.
- `pg_policies`: صفر Policy.
- Security Advisor: 11 مورد `rls_enabled_no_policy`.
- Performance Advisor: 10 ایندکس بدون استفاده؛ در دیتابیس خالی حذف آن‌ها توجیه نشده است.
- Health Advisor: بدون مورد.
- `role_table_grants`: فقط `postgres` برای جدول‌های public برگشت؛ برای `anon` و `authenticated` مجوز جدولی در این خروجی نبود.
- نقش اختصاصی با پیشوند `vayro_` مشاهده نشد. نقش‌های استاندارد Supabase شامل `service_role` و `postgres` با قابلیت bypass RLS هستند.

هیچ SQL نوشتنی، DDL، Grant، Policy، Migration یا تغییر داده اجرا نشد؛ Queryهای اجراشده فقط SELECT بودند.

## 5) Backup / Restore و موانع مالک

- روی SHA شاخه اصلی VAYRO، دو اجرای Backup ناموفق ثبت شده‌اند: [Run 45985440725](https://github.com/gavad54/zelmira-one-/actions/runs/45985440725) و [Run 45805286510](https://github.com/gavad54/zelmira-one-/actions/runs/45805286510).
- علت قابل مشاهده: پیکربندی محافظت‌شده موردنیاز Backup در GitHub Actions حاضر نیست. نام یا مقدار Secretها در این سند ثبت نمی‌شود.
- Artifact مستقل Backup: اثبات نشده؛ Restore واقعی و Invariant verification: انجام نشده.
- PR #63 تست read-back، byte comparison و SHA-256 و رد فایل/sidecar دستکاری‌شده را در CI تأیید می‌کند؛ این جایگزین Backup/Restore واقعی نیست.

## 6) مرزهای محصول و تصمیم

- DANA هسته داخلی VAYRO است، نه محصول مستقل.
- ARIA فاقد حسابداری و ERP است؛ ARIANA مالک حسابداری/ERP/مالیات است؛ LEADORA مالک عملیات توزیع است.
- ARVAND، CHARSU، GANJINEH، NEGAH، SEPEHR، NAMA و PAYAM حفظ می‌شوند؛ بدون مخزن/Runtime مستقل و E2E، عملیاتی یا مستقل اعلام نمی‌شوند.
- وضعیت انتشار VAYRO و محصولات مستقل همچنان BLOCKED است.
- هیچ Merge، Production Deploy، DNS، Migration زنده، تغییر دسترسی/Secret، خرید یا تغییر پلن انجام نشد.
- اجرای دائمی Worker/Scheduler و بازیابی پس از Restart در Runtime مستقر اثبات نشده است.


## 7) تکمیل شواهد پس از ممیزی تکمیلی

### ARIANA — بازیابی سورس قدیمی‌تر از کاتالوگ مخزن
- آرشیو `ARIYANA_v0.45_COMMERCIAL_HARDENED.zip` از Library بازیابی شد.
- SHA-256 مورد انتظار و محاسبه‌شده برابر است: `5505e312312d4518d08c4b1bdac06746db5ee3c8c7f4b0b7b14b27fc2eb18516`.
- ZIP سالم؛ 246 فایل و 757,293 بایت سورس استخراج‌شده.
- آزمون آرشیو اصلی: 121 passed, 1 skipped؛ compileall و JavaScript syntax PASS.
- فایل امنیتی آرشیو دارای fallback ثابت Development است؛ نسخه سخت‌شده JWT در PR #1 حفظ می‌شود و نباید با آن جایگزین شود.
- PR #1 با سند ممیزی افزوده شد؛ Head جدید `f1983d9e03dbd9925789c0dd642e2183ec7de7fb`، CI PASS، CodeQL در حال اجرا هنگام ثبت نتیجه.
- سورس کامل هنوز به مخزن canonical وارد نشده است؛ هیچ Migration اجرا نشده است.
- [سند ممیزی آرشیو در PR #1](https://github.com/gavad54/ARIANA/blob/engineering/ariana-v0.38-standalone-bootstrap/docs/ARIANA_SOURCE_ARCHIVE_V045_AUDIT_2026-11-28.md)

### نتیجه نهایی آزمون‌های این نوبت
- VAYRO PR #59 روی Head `436626f510122654e2c1288d942e1bee99307a5e`: CI و CodeQL PASS.
- VAYRO PR #63 روی Head `a45da05755e08c7cf0817b3159b68a9a4ace88fa`: CI و CodeQL PASS؛ Backup/Restore واقعی همچنان اثبات نشده.
- ARMIN MARKET PR #2 روی Head `0aec0115b09a7c04559117f60c7f5cb3ab15b160`: Android Build PASS و CodeQL PR PASS؛ Dependency Review به‌علت غیرفعال بودن Dependency Graph شکست خورد؛ CodeQL Push هنوز در حال اجرا بود.
- ARIANA PR #1 روی Head `f1983d9e03dbd9925789c0dd642e2183ec7de7fb`: CI PASS؛ CodeQL هنوز در حال اجرا بود.

