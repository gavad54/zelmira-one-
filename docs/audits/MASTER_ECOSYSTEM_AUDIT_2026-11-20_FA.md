# گزارش جامع ممیزی اکوسیستم VAYRO و محصولات — ۲۰ نوامبر ۲۰۲۶

## خلاصه مدیریتی

این گزارش با تطبیق تاریخچه قابل‌بازیابی گفتگوها، فایل‌های موجود در Library، اسناد معماری، مخازن GitHub، CI، پروژه Supabase و محیط‌های Railway تهیه شده است. بررسی پایگاه داده و Railway در این نوبت read-only بوده و هیچ تغییری در داده Production، نقش‌ها، مجوزها، سرویس‌ها یا Deploymentها اعمال نشده است.

**تصمیم معماری معتبر:** VAYRO مادر است و شش اپ مستقل مستقیم دارد: ARIA، ARIANA، LEADORA، ARMIN MARKET، DANA و ARVAND. چهار حوزه GANJINEH، NEGAH، SEPEHR و NAMA داخل ARIA هستند. CHARSU در ARMIN MARKET و PAYAM در LEADORA ادغام مفهومی/محصولی شده‌اند؛ سوابق تاریخی آنها باید حفظ شود.

**وضعیت انتشار:** هیچ‌یک از شش محصول در این ممیزی به‌عنوان مجموعه کامل Production، تجاری و UAT-approved تأیید نشد. VAYRO در وضعیت ENGINEERING IN PROGRESS / DEPLOYMENT BLOCKED است.

## ۱. معماری و تصمیم‌های معتبر

### ۱.۱ ساختار مستقیم محصولات

| سطح | محصول | مرز مسئولیت |
|---|---|---|
| مادر | VAYRO | هویت، دسترسی، حاکمیت، مجوزها، هماهنگی و APIهای مشترک |
| مستقل ۱ | ARIA | هوش مصنوعی، ارتباطات، خدمات و فضای کار دیجیتال؛ بدون حسابداری/ERP |
| مستقل ۲ | ARIANA | حسابداری، دفترکل، امور مالی و ERP؛ مالک یگانه این دامنه |
| مستقل ۳ | LEADORA | توزیع، فروش، موجودی، عملیات تجاری و رشد |
| مستقل ۴ | ARMIN MARKET | بازارگاه، درخواست خریدار، پیشنهاد تأمین‌کننده و هوشمندی بازار |
| مستقل ۵ | DANA | اپ مستقل مرکز فرماندهی و هماهنگی مجاز اکوسیستم |
| مستقل ۶ | ARVAND | تجارت بین‌الملل، واردات، صادرات و عملیات بازرگانی |

چهار دامنه داخلی ARIA:
- GANJINEH — فروشگاه دیجیتال و کاتالوگ.
- NEGAH — استودیوی خلاقیت و تولید محتوا.
- SEPEHR — ابزارهای ابری و مدیریت منابع.
- NAMA — وب‌سایت‌ساز و صفحه‌ساز.

تغییرات نام/ادغام:
- CHARSU دیگر محصول مستقل نیست؛ دامنه بازارگاه آن به ARMIN MARKET منتقل شده است.
- PAYAM دیگر محصول مستقل نیست؛ دامنه بازاریابی و رشد آن به LEADORA منتقل شده است.
- این تصمیم حذف فایل، ماژول، سابقه یا داده تاریخی را مجاز نمی‌کند. تمام ورودی‌های قدیمی باید در Crosswalk قابل ردیابی بمانند.
- DANA دیگر قابلیت داخلی VAYRO محسوب نمی‌شود؛ یک اپ مستقل مستقیم در خانواده است.

### ۱.۲ قواعد معماری لازم‌الاجرا

1. ARIA هیچ حسابداری، دفترکل یا ERP ندارد؛ این قابلیت‌ها فقط در ARIANA هستند.
2. شش اپ مستقل باید منطق دامنه، مالکیت داده، مجوزها، چرخه انتشار و شواهد پذیرش خود را داشته باشند.
3. ارتباط میان محصولات فقط از API/eventهای نسخه‌دار با هویت سرویس محدود، idempotency، correlation ID و audit log انجام شود.
4. دسترسی DANA به هر محصول باید از همان APIهای مجاز عبور کند؛ دسترسی مستقیم به جدول‌های خصوصی محصول ممنوع است.
5. قابلیت‌های قدیمی فقط پس از Crosswalk و تأیید مالک قابل حذف یا تغییر مرز هستند.
6. تعداد محصول، ماژول، فایل، قرارداد، Adapter، Provider و قابلیت آرشیوی باید جداگانه گزارش شود.

## ۲. وضعیت مخازن و Pull Requestها

### ۲.۱ VAYRO

مخزن موجود: [gavad54/zelmira-one-](https://github.com/gavad54/zelmira-one-)

نام مخزن هنوز تاریخی است، هرچند نام اپلیکیشن باید VAYRO/وایرو باشد.

| PR | موضوع | وضعیت در زمان ممیزی |
|---|---|---|
| #39 | مهندسی، امنیت و release gates | Open، non-draft؛ شاخه engineering/vayro-hardening-2026-11-18 |
| #45 | معماری شش‌محصولی | Open، Draft، ادغام‌نشده؛ شاخه architecture/vayro-six-product-family-2026-11-19 |
| #41 | معماری پنج‌اپلیکیشنی قدیمی | منسوخ‌شده؛ نباید ادغام شود |
| #42 | ساختار قبلی چهارتایی | منسوخ‌شده؛ عنوان PR نیز آن را superseded اعلام کرده است |

شاخه PR #39 پس از ممیزی به‌روزرسانی اسناد معماری، مرز محصولات، README و Release Gates را دریافت کرده است. CI جدید روی head جدید در حال اجرا بود. آخرین CI کامل‌شده روی head قبلی 89c60ab3c8b7bba6bc6cf6d7b10d1cac239dadb5 در مرحله dependency audit شکست داشت؛ CodeQL همان head موفق بود.

در PR #45، ناسازگاری واقعی بین سند معماری شش‌محصولی و رابط/رجیستری قدیمی کشف و در شاخه همان PR اصلاح شد: صفحه اصلی، product directory، owner catalog، آزمون‌ها و تست یکپارچه owner products به شش محصول مستقل و چهار دامنه داخلی ARIA تغییر کردند. Workflow نیز اصلاح شد تا تست‌ها و build پیش از dependency audit اجرا شوند. نتیجه CI جدید باید روی head نهایی بررسی شود؛ سبز بودن CodeQL به معنی سبز بودن CI نیست.

### ۲.۲ ARIA

مخزن: [gavad54/aria-android](https://github.com/gavad54/aria-android)

- PR #2 و PR #3 هر دو Draft و ادغام‌نشده‌اند.
- PR #3 به شاخه engineering/aria-functional-redesign-2026-11-19 وابسته است، نه مستقیم به main؛ ترتیب ادغام و وابستگی PRها باید قبل از Merge مشخص شود.
- آخرین اجرای موفق ARIA CI در ۲۰ نوامبر: **۸۷۰ تست موفق، صفر ناموفق**.
- آخرین head ثبت‌شده در PR #3 هنگام این ممیزی: f3b0aa780aad5aa8e0228412398e1ff754365be4.

### ۲.۳ LEADORA

مخزن: [gavad54/LEADORA](https://github.com/gavad54/LEADORA)

- PR #46 باز و ادغام‌نشده است.
- PR #47 برای نصب مستقل مشتریان Draft و بر پایه PR #46 است.
- PR #51 برای بازنشسته‌سازی UI مالی قدیمی Draft است.
- PR #52 برای مرکز رشد و بازاریابی Draft است.
- PR #52 روی head 052ac350dc15f8fa6a27f2f62c0c94205393e7d0 در CI و regression/security موفق بود؛ آزمون Python: ۹۷ passed با ۲ warning.
- موفقیت CI به معنی فعال بودن سرویس Production یا تکمیل همه ماژول‌ها نیست.
- دامنه بازاریابی PAYAM در LEADORA ادغام می‌شود؛ نام PAYAM نباید محصول مستقل بماند.

### ۲.۴ ARMIN MARKET

مخزن: [gavad54/Armin_market](https://github.com/gavad54/Armin_market)

- PR #1 برای API درخواست خریدار و پیشنهاد تأمین‌کننده Draft است؛ Backend CI موفق بوده است.
- PR #2 برای مرکز هوشمندی بازار Draft است.
- Android APK Build روی head 72e8a2bd77ba6123bf7a4f5a863891b8fc0ebc43 موفق بوده؛ این فقط ساخت Debug APK است، نه امضای Release، نصب/آزمون دستگاه یا انتشار تجاری.
- CHARSU در این محصول ادغام مفهومی شده و نباید کاتالوگ مستقلی داشته باشد.

### ۲.۵ محصولات فاقد مخزن مستقل

در بررسی GitHub زیر حساب gavad54:
- ARIANA: مخزن canonical مستقل پیدا نشد؛ فایل‌های Source در Library وجود دارند.
- DANA: مخزن اجرایی مستقل پیدا نشد؛ مستندات و تصمیم معماری موجود است.
- ARVAND: مخزن اجرایی مستقل پیدا نشد؛ محصول مستقل در معماری مصوب است.

نبود مخزن به معنی نبود ایده یا سند نیست؛ به معنی نبود منبع اجرایی canonical و قابل انتشار است.

## ۳. ممیزی ARIA: تفکیک موجودی‌ها

این اعداد نباید با هم جمع یا هم‌معنا فرض شوند:

| موجودی | مقدار | تفسیر |
|---|---:|---|
| Canonical archive ARIA 32 | ۶۳۹ | شناسه‌های قابلیت آرشیوی؛ نه ۶۳۹ ماژول Production |
| Backend registry فعلی | ۲۰۱ | ماژول‌های مستقل Backend |
| Idea modules | ۵۰ | خانواده ایده |
| Governance controls | ۴ | کنترل حاکمیتی |
| Commercial catalog | ۷۲ | کاتالوگ تجاری |
| Child engines | ۷۱ | موتور فرزند |
| Service engines | ۴ | موتور تحویل خدمت |
| Cohort تاریخی ۱۸۳ | ۴۰ + ۷۲ + ۷۱ | ۴۰ ایده اولیه + ۷۲ کاتالوگ + ۷۱ موتور |

در مخزن فعلی، ۵۰ ایده، ۷۲ کاتالوگ و ۷۱ موتور دارای strategyهای ماژول‌محور محلی هستند؛ در نتیجه خانواده فعلی ۱۹۳ عضو هدف دارد و cohort تاریخی ۱۸۳تایی در این موجودی قرار می‌گیرد. با این حال، ادعای تبدیل یک‌به‌یک ۱۸۳ شناسه تاریخی فقط پس از Crosswalk دقیق Canonical ID → Backend Module ID → file → test → provider evidence قطعی است.

یک موجودی مستقل دیگر در ممیزی Adapterهای خارجی ثبت شده:
- ۱۹۱ ردیف نیاز Adapter؛
- ۱۶۰ مورد ضروری؛
- ۳۱ مورد مشروط؛
- ۴۴۸ مورد اختیاری؛
- ۵ تعریف interface-only؛
- صفر Provider با اثبات اجرای زنده در گزارش ممیزی منبع.

این ۱۹۱ ردیف، همان ۱۸۳ ماژول تاریخی نیستند.

رجیستری فعلی Backend:
- DOMAIN_LOGIC_LOCAL: ۲۰۱
- DOMAIN_ADAPTER_LOCAL: ۰
- productionVerified: ۰
- externalExecutionEnabled: ۰
- paymentExecuted: ۰

این وضعیت فقط منطق دامنه‌ای محلی را نشان می‌دهد؛ نه اتصال Provider، عملیات بیرونی، پایگاه داده پایدار، پرداخت یا Production. ۷۲ ماژول تجاری هنوز طراحی‌شده/غیرتجاری‌سازی‌شده‌اند.

آرشیو ۶۳۹تایی و ماژول‌های ۲۰۱تایی Backend باید با حفظ شناسه‌ها و تاریخچه به هم Crosswalk شوند؛ نباید ۶۳۹ را به دلیل وجود ۲۰۱ ماژول Backend تکمیل‌شده اعلام کرد.

## ۴. وضعیت ARIANA و آرشیوهای قدیمی

در Library فایل‌های Source مربوط به ARIANA از چند نسل نسخه موجود است، از جمله نسخه‌های v0.37.x، v0.45 و 16.0.0. یک کاندید سخت‌سازی‌شده v0.37.1 دارای گزارش ۹۴ تست موفق بوده است. این گزارش به‌تنهایی اثبات‌کننده کامل‌ترین یا جدیدترین Source نیست.

اقدامات ضروری:
1. فهرست و hash تمام آرشیوها را ثبت کنید.
2. تفاوت نسخه‌ها و migrationها را استخراج کنید.
3. آخرین Source کامل را با تست و Build بازتولیدپذیر انتخاب کنید.
4. مخزن مستقل ARIANA بسازید و فایل‌های منبع را با تاریخچه حفظ‌شده وارد کنید.
5. مرز ARIA بدون حسابداری و ARIANA با حسابداری/ERP را در API و تست معماری enforce کنید.

## ۵. زیرساخت VAYRO-CORE — بررسی زنده ۲۰ نوامبر

پروژه Supabase:
- نام: VAYRO-CORE
- وضعیت: ACTIVE_HEALTHY
- PostgreSQL 17.11
- منطقه: eu-central-1

نتیجه بررسی read-only:
- ۱۱ جدول public موجود؛ همه RLS روشن؛ همه صفر رکورد در بررسی.
- ۱۱ هشدار Security Advisor از نوع RLS enabled / no policy.
- query مستقیم: صفر policy در schema public.
- query مستقیم: صفر table grant برای anon، authenticated و service_role.
- نقش‌های اختصاصی vayro_app، vayro_auth، vayro_platform و vayro_migration در pg_roles وجود نداشتند.
- Prisma در Source پانزده مدل دارد؛ چهار جدول UserMfa، MfaRecoveryCode، AuthChallenge و AiGeneration در Live DB موجود نیستند.
- جدول Session چهار ستون revokedAt، lastSeenAt، assurance و mfaAuthenticatedAt را ندارد.
- AuditEvent.tenantId فاقد Foreign Key متناظر با Prisma است.
- Migration history خالی است.
- Performance Advisor ده unused-index observation گزارش کرده است؛ با توجه به صفر بودن داده/ترافیک، حذف ایندکس مجاز نیست.

**نتیجه:** Schema زنده و Prisma هم‌تراز نیستند. RLS روشن بدون policy به معنی آماده بودن Tenant Isolation نیست. هیچ DDL، role grant یا migration تولیدی بدون Backup، Restore Drill و طرح migration/recovery مجاز نیست.

## ۶. Railway — بررسی زنده ۲۰ نوامبر

فقط دو پروژه در حساب قابل مشاهده بود:

### ARIA Web
- یک سرویس live با نام VAYRO در فهرست منابع؛ وضعیت runtime: Offline.
- Source: مخزن zelmira-one-، شاخه main.
- یک سرویس دیگر در وضعیت staged-create از شاخه brand/vayro-name-only؛ هنوز Deployment ندارد.
- سه تغییر در patch مرحله‌ای وجود دارد؛ این مورد live محسوب نمی‌شود.
- Volume و Bucket در این محیط مشاهده نشد.

### LEADORA
- سرویس leadora-web از مخزن LEADORA، شاخه main؛ runtime: Offline.
- Volume به نام leadora-data با ظرفیت ۵۰۰ MB در مسیر /data متصل است.
- سرویس دیگری با نام VAYRO از مخزن zelmira-one-، شاخه security/mfa-session-endpoint-gates وجود دارد؛ runtime: Offline.
- Bucket مشاهده نشد.

**نتیجه:** پروژه مستقل VAYRO در Railway موجود نیست. سرویس‌های هم‌نام VAYRO در ARIA Web و LEADORA جایگزین میزبانی مستقل VAYRO نیستند و هر دو خاموش‌اند. سرویس‌های ARIA/LEADORA نباید بدون طراحی و تأیید مالک به عنوان VAYRO استفاده شوند.

## ۷. Backup، Restore و امنیت وابستگی‌ها

### Backup
Workflow رمزگذاری‌شده offsite وجود دارد؛ اما اجرای زمان‌بندی‌شده ۲۰ نوامبر، run 44715405983، در مرحله اعتبارسنجی متوقف شد:
- علت: Secret محافظت‌شده VAYRO_BACKUP_DATABASE_URL در Environment با نام vayro-backup موجود نبود.
- در نتیجه dump، encryption و upload انجام نشد.
- هیچ Restore Drill موفقی در شواهد بررسی‌شده وجود نداشت.

### Dependency security
- PR #39 در head قبلی 89c60ab3...، VAYRO CI run 44716135634 به دلیل dependency audit شکست خورد؛ CodeQL run 44716135732 موفق بود.
- Advisory: GHSA-7589-6fvf-x4pw / CVE-2026-121707.
- نسخه‌های effect تا 3.22.0 آسیب‌پذیرند؛ نسخه اصلاح‌شده 3.22.1 است.
- dependency از مسیر @prisma/config / Prisma وارد شده است.
- پیشنهاد npm audit fix --force به downgrade شکسته Prisma 6.12.0 می‌رسد؛ این روش نباید اجرا شود.
- باید override/به‌روزرسانی lockfile سازگار انجام شود و همه تست‌ها دوباره اجرا شوند.

## ۸. ماتریس وضعیت محصولات

| محصول | منبع کد/آرشیو | CI/Build | استقرار زنده | تجاری/Production |
|---|---|---|---|---|
| VAYRO | مخزن موجود با نام تاریخی zelmira-one- | CI فعلی در حال بررسی؛ CodeQL روی headهای قبلی موفق | Railway مستقل ندارد؛ سرویس‌های موجود خاموش | مسدود |
| ARIA | مخزن aria-android + آرشیو ۶۳۹تایی در Library | ۸۷۰ تست موفق | Production تأیید نشده | Provider، پرداخت و Production صفر |
| ARIANA | Source archive در Library؛ مخزن مستقل ندارد | کاندید قدیمی ۹۴ تست موفق؛ نسخه‌های جدیدتر نیازمند ممیزی | تأیید نشده | نیازمند Source canonical، DB و Release |
| LEADORA | مخزن LEADORA | PR #52: ۹۷ تست موفق، ۲ warning | Railway Offline | انتشار و UAT تأیید نشده |
| ARMIN MARKET | مخزن Armin_market | Backend CI و Debug APK build موفق | Railway/Backend زنده تأیید نشده | Release signing، device test و UAT لازم |
| DANA | مستندات و معماری؛ مخزن مستقل پیدا نشد | آزمون اجرایی مستقل موجود نیست | ندارد | طراحی/Source لازم |
| ARVAND | معماری مصوب؛ مخزن مستقل پیدا نشد | آزمون اجرایی مستقل موجود نیست | ندارد | طراحی/Source لازم |

## ۹. خطاها، تناقض‌ها و مواردی که قبلاً جا افتاده بودند

1. اسناد قدیمی VAYRO هنوز ساختار ۱۱ محصول و DANA داخلی را نشان می‌دادند؛ در حالی که تصمیم جدید شش اپ مستقل است.
2. صفحه اصلی و Owner Product Catalog با اسناد معماری شش‌محصولی هم‌خوان نبودند؛ در PR #45 اصلاح شده‌اند و CI جدید باید تأیید نهایی کند.
3. PR #41 و #42 با تصمیم جدید ناسازگارند و نباید ادغام شوند.
4. ARIA ۶۳۹تایی آرشیو با ۲۰۱ Backend و cohort تاریخی ۱۸۳تایی یکی نیست.
5. ۱۹۱ ردیف نیاز Adapter خارجی، فهرست ۱۸۳ ماژول تاریخی نیست.
6. موفقیت ۸۷۰ تست ARIA به معنی Provider، پرداخت یا Production نیست.
7. ARIANA آرشیو دارد اما مخزن مستقل canonical ندارد؛ نباید آن را «فاقد Source» اعلام کرد.
8. DANA و ARVAND به عنوان محصولات مستقل تصویب شده‌اند اما مخزن اجرایی ندارند.
9. سرویس‌های VAYRO در Railway offline و تکراری/داخل پروژه‌های دیگرند؛ پروژه مستقل VAYRO وجود ندارد.
10. ۱۱ جدول RLS-enabled بدون policy، migration history خالی و schema drift به معنی آماده بودن DB نیست.
11. Backup workflow موجود است اما Secret لازم غایب است؛ بنابراین Backup واقعی اجرا نشده.
12. Dependency audit روی اثر ReDoS شکست دارد و باید با lockfile سازگار رفع شود، نه با force downgrade.
13. PRهای Draft و شاخه‌های وابسته هنوز ادغام نشده‌اند؛ CI یک شاخه را نباید به کل محصول تعمیم داد.

## ۱۰. اولویت اجرایی اصلاح و تکمیل

### P0 — موانع امنیتی و انتشار
1. رفع effect ReDoS با نسخه 3.22.1+ و lockfile معتبر، بدون downgrade Prisma.
2. تنظیم Secret/Variables پشتیبان در GitHub Environment و اجرای Backup واقعی.
3. Restore Drill مستقل روی دیتابیس ایزوله و ثبت checksum، row counts، RPO/RTO.
4. تکمیل schema diff، migration baseline، نقش‌های اختصاصی و ماتریس RLS؛ هیچ migration تولیدی قبل از Restore تأییدشده.
5. ایجاد پروژه و سرویس مستقل VAYRO در Railway؛ عدم استفاده مجدد از سرویس‌های ARIA/LEADORA.

### P1 — معماری و مخازن
6. نهایی‌سازی PR #39 و سپس PR #45 با ترتیب ادغام کنترل‌شده؛ بستن PRهای معماری منسوخ #41/#42.
7. ایجاد مخازن canonical برای ARIANA، DANA و ARVAND.
8. یکپارچه‌سازی ARIA archive 639 با Backend 201 از طریق Crosswalk شناسه‌محور.
9. تکمیل Crosswalk cohort 183 تاریخی و تفکیک آن از ماتریس 191 ردیفی Adapter بیرونی.
10. تثبیت مرز CHARSU→ARMIN MARKET و PAYAM→LEADORA بدون حذف تاریخچه.

### P2 — عملیات و درآمد
11. تکمیل E2E هر محصول، Tenant isolation، authorization، observability و failure handling.
12. اتصال Providerها فقط با قرارداد نسخه‌دار و شواهد sandbox.
13. قیمت‌گذاری، entitlement، billing، payment webhook، refund و reconciliation.
14. Android release signing، نصب و آزمون دستگاه، سپس UAT.
15. تأیید حقوقی/حریم خصوصی، مالکیت دارایی‌ها و اجازه انتشار.

## ۱۱. استاندارد گزارش‌دهی از این پس

هر قابلیت باید یکی از این وضعیت‌ها را داشته باشد:
- طراحی‌شده؛
- منطق محلی اجراشونده؛
- دارای Provider/سرویس بیرونی تأییدشده؛
- دارای E2E و داده پایدار؛
- Production فعال؛
- تجاری/پرداخت فعال؛
- مسدود یا نیازمند تأیید.

هیچ درصد کلی بدون تعریف مخرج و شواهد منتشر نشود. تعداد فایل‌ها، strategyها، تست‌ها، ماژول‌های Backend، قابلیت‌های آرشیوی و Adapterهای بیرونی جداگانه گزارش شوند.

## نتیجه نهایی

اکوسیستم از نظر طراحی و کد در چند مخزن پیشرفت قابل توجه دارد؛ اما موانع اصلی اکنون فقط «ساخت ماژول بیشتر» نیستند. اولویت قطعی، یکپارچگی معماری، هم‌ترازی کد و اسناد، امنیت Dependency، تکمیل DB، میزبانی مستقل، Backup/Restore و شواهد Production است.

**وضعیت کل: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**


## به‌روزرسانی شواهد CI — ۲۰ نوامبر ۲۰۲۶، ساعت ۱۳:۲۵ UTC

- شاخه شش‌محصولی PR #45 روی head `f39ffebdb9f46dcbc6c27c2631a0fef6f911e67a`:
  - VAYRO CI run [44743453473](https://github.com/gavad54/zelmira-one-/actions/runs/44743453473): **failure فقط در production dependency audit**.
  - Unit tests: **۹۱ passed / ۰ failed**.
  - PostgreSQL و HTTP integration tests: **۳۰ passed / ۰ failed**.
  - Prisma generation/validation، migration در PostgreSQL ایزوله، آزمون نقش‌های auth/platform/tenant، RLS isolation، lint، typecheck، production build و Docker build همگی موفق.
  - CodeQL run [44743453471](https://github.com/gavad54/zelmira-one-/actions/runs/44743453471): success.
- شاخه hardening PR #39 روی head `9c2bc924a0de7557760627bcf04887a155058bde`:
  - CodeQL run [44743973406](https://github.com/gavad54/zelmira-one-/actions/runs/44743973406): success.
  - VAYRO CI run [44743973402](https://github.com/gavad54/zelmira-one-/actions/runs/44743973402): cancelled؛ بنابراین این head شواهد CI کامل تازه ندارد.
  - آخرین CI کامل‌شده روی head قبلی هنوز همان failure در dependency audit است؛ کد نباید تا اجرای مجدد کامل و رفع audit، release-ready اعلام شود.
- ARIA روی head `f3b0aa780aad5aa8e0228412398e1ff754365be4`: CI موفق؛ **۸۷۰ passed / ۰ failed**.
- LEADORA PR #52 روی head `052ac350dc15f8fa6a27f2f62c0c94205393e7d0`: CI و regression/security موفق؛ **۹۷ تست Python passed، ۲ warning**.
- ARMIN MARKET PR #2: Debug APK build موفق؛ این مدرک امضای Release یا نصب/پذیرش دستگاه نیست.

**تفسیر:** معماری شش‌محصولی و اصلاح رابط/رجیستری در شاخه PR #45 از نظر unit/integration/build آزموده شده‌اند؛ dependency audit همچنان مانع merge/release است. CI cancelled روی PR #39 نیز نباید به‌عنوان pass ثبت شود.


## ۱۲. بررسی باینری آرشیوهای اصلی Library

فهرست metadata کتابخانه در این بررسی ۳۹۴ مورد را نشان داد: ۹ پوشه و ۳۸۵ فایل. پنج بسته منبع اصلی زیر از Library materialize، hash و از نظر ساختار/آزمون بررسی شدند. این بررسی روی کپی کاری انجام شد و فایل‌های اصلی Library تغییر نکردند.

| بسته | SHA-256 | اندازه | آزمون محلی |
|---|---|---:|---:|
| ARIA 32 Runtime Fixes Release Readiness Source (20261119-193450).zip | `6ebe65d8058ef83c9b8a0845054dd4fd01068cf249cdf29492d8fa6d451e0be9` | 3,403,822 B | static gates با تناقض نسخه؛ Build اندروید انجام نشد |
| ariaana_android_app_v42_benchmark_hardened(3).zip | `f07d57b9de11cc95edc104649be3838308df97f44ffa6795319c0a9a431b920a` | 379,580 B | ۱۰۹ تست Python موفق |
| ARIANA_16.0.0_FINAL_REVENUE_FIRST.zip | `070441acead58278cc7e62886b60be760507515f8b9b64a324ed60a442527d7f` | 2,883,117 B | تست مستقل در بسته پیدا نشد؛ نام فایل با محتوای واقعی هم‌خوان نیست |
| LEADORA_MVP_0_3_SOURCE.zip | `97a6f58c109ea6c2178795548b3234953dd0c90d270730d8948feb11097acb34` | 26,544 B | ۱۲ تست Python موفق |
| ArminMarket_v1.3.3_FINALIZATION_BUNDLE.zip | `39665264c5d20b1616171de448e0c56e02b7b2bf16bd74b857b5a0f14ab2cb59` | 111,372 B | ۶ تست Backend موفق |

### ۱۲.۱ ARIA 32 — تناقض نسخه و Release Gate

- سه رجیستری Android/Backend با ۶۳۹ شناسه و نسخه 32.0.0 همگام‌اند؛ `verify_module_capability_matrix.sh` موفق شد و خروجی `MODULES=639` داد.
- `aria24_capability_registry.json` جداگانه ۱۰۹ کلید ماژول و ۸۱ موتور دارد.
- ماتریس‌های قدیمی 15.19/15.20/15.23 همچنان ۲۳۲ ردیف دارند.
- README بالای آرشیو 639 شناسه و نسخه 32.0.0 را مرجع معرفی می‌کند، ولی `MODULE_OPERATIONAL_REPORT_15.19.0` و `RELEASE_READINESS_FA` اعداد ۲۳۲ و ۳۲۹ را در متن‌های قدیمی‌تر ثبت کرده‌اند.
- `verify_module_runtime_r3.sh` به علت انتظار ۲۳۲ ماژول شکست خورد.
- `FINAL_VERIFY.sh` بعد از عبور static verify 639، در assertion قدیمی ۲۳۲/15.24.0 شکست خورد.
- `RELEASE_GATE.sh` چند gate ایستا و تست قرارداد را پاس کرد، اما با پیام `FAIL: missing gradle` و exit code 1 خاتمه یافت.
- Gradle Wrapper JAR/اجرای قابل بازتولید و Android SDK در بسته حاضر نیستند؛ APK/AAB، نصب دستگاه، Provider، پرداخت و Production تأیید نشده‌اند.

نتیجه: رجیستری ۶۳۹تایی در سه فایل sync است، اما release scripts با نسخه جاری هم‌تراز نیستند. این آرشیو Production-certified نیست.

### ۱۲.۲ ARIANA v0.42 — کاندید واقعی‌تر، ولی دارای مانع Migration

- فایل `ariaana_android_app_v42_benchmark_hardened(3).zip` به آریانا اختصاص دارد؛ README_V42 آن را ARIANA v0.42 معرفی می‌کند و V36 changelog تغییر نام از «آریا حساب» به «آریانا» را ثبت کرده است.
- ۱۰۹ تست Python در کپی محلی موفق شد؛ این نتیجه معادل تست PostgreSQL، Android build یا Production نیست.
- Android `applicationId` هنوز `ir.aria.hesab` و نام پروژه `AriaHesab` است؛ نام‌گذاری داخلی با برند نهایی ARIANA هم‌تراز نشده است.
- Gradle Wrapper در بسته پیدا نشد؛ APK/AAB build و signing تأیید نشده‌اند.
- Backend در صورت نبود `DATABASE_URL` به SQLite محلی `aria_hesab_dev.db` می‌رود و `main.py` هنگام import، `Base.metadata.create_all` را اجرا می‌کند؛ این جایگزین migration versioned و production migration نیست.
- سه SQL migration یک زنجیره منسجم تشکیل نمی‌دهند: migration 001/002 از `organizations`, `parties`, `products` استفاده می‌کنند؛ migration 003 به `party`, `tenant`, `product` ارجاع می‌دهد و `ALTER TABLE party` دارد. جدول‌های مرجع متناظر در 001/002 ساخته نشده‌اند. Backend ORM نیز schema tenant/party/product جداگانه دارد.
- بنابراین migration 003 در ترتیب فعلی قابل اتکا نیست و باید قبل از هر استقرار بازطراحی و با PostgreSQL واقعی آزموده شود.
- `backend/README.md` هنوز نسخه v0.5 را معرفی می‌کند؛ مستندات Backend با v0.42 هم‌تراز نیستند.
- `test_v42_benchmark.py` یک assertion شرطی دارد که عملاً همیشه True می‌شود؛ این تست باید اصلاح شود.

نتیجه: v0.42 بهترین کاندید آرشیوی پیدا‌شده برای Source مستقل ARIANA است، اما هنوز نیازمند تثبیت نام/شناسه بسته، اصلاح migrationها، آزمون PostgreSQL، امنیت/tenant، Gradle و مخزن canonical است.

### ۱۲.۳ بسته‌ای که به اشتباه ARIANA 16.0.0 نام‌گذاری شده

محتوای `ARIANA_16.0.0_FINAL_REVENUE_FIRST.zip` در واقع پوشه `aria_final`، نام اپ «آریا»، package id `com.aria.ermian` و نسخه مرجع ARIA 15.18.4/231 ماژول را نشان می‌دهد. درون آن «Ariana Universal ERP» به‌عنوان یک لایه/محصول در مستندات ARIA ذکر شده است. این فایل نباید به‌عنوان Source canonical آریانا مستقل استفاده شود. نام فایل گمراه‌کننده است؛ آن را حفظ کنید اما در کاتالوگ Sourceها به‌عنوان آرشیو ARIA طبقه‌بندی کنید.

### ۱۲.۴ LEADORA و ARMIN MARKET

- بسته LEADORA MVP 0.3 شامل ۲۱ فایل و ۱۲ تست موفق است. README و Release Audit صریحاً آن را MVP محدود مبتنی بر SQLite می‌دانند؛ اتصال زنده شبکه‌های اجتماعی، AI واقعی، PostgreSQL، MFA، rate limiting، Backup/Restore، پرداخت و استقرار اینترنتی در آن فعال نیستند. مخزن GitHub فعلی جدیدتر است و باید مرجع توسعه باشد.
- بسته ArminMarket v1.3.3 شامل ۱۱۲ ورودی و ۶ تست Backend موفق است. Release Gate هنوز PostgreSQL integration، Docker migration، Android SDK build، Android/API E2E، بار/همزمانی، SAST، امنیت مستقل، Backup/Restore و انطباق حقوقی را باز می‌داند. GitHub repository مرجع فعلی است؛ بسته Library یک snapshot قدیمی‌تر است.

### ۱۲.۵ قاعده انتخاب Source

از این تاریخ:
- نام فایل ZIP به‌تنهایی مرجع نسخه نیست.
- هر Source با SHA-256، applicationId/package name، versionCode/versionName، commit/source lineage، تعداد تست، migration status و build evidence ثبت شود.
- Sourceهای متناقض یا misnamed حذف نشوند؛ در Source Ledger با وضعیت `HISTORICAL`, `CANDIDATE`, `CANONICAL` یا `REJECTED_AS_WRONG_PRODUCT` طبقه‌بندی شوند.
- تا زمان انتخاب و تأیید مالک، هیچ آرشیوی به مخزن canonical وارد یا جایگزین Source دیگر نشود.


## ۱۳. اسناد تاریخی که نباید مبنای وضعیت فعلی قرار گیرند

### ماتریس ۱۱ محصول — ۱۸ نوامبر
فایل Library با نام `VAYRO_11_Product_Execution_Matrix_2026-11-18.xlsx` در ۱۸ نوامبر و بر اساس commit `e0ba1a2143d013daf901899df1e0ef6f8dcea8a6` تهیه شده بود. این ماتریس ۱۱ محصول مستقل را می‌شمارد، DANA را موتور داخلی معرفی می‌کند و برای سبد ۱۱ محصول میانگین بلوغ پذیرش ۱۸٫۲٪ گزارش می‌دهد.

این سند قبل از تصمیم ۱۹ نوامبر درباره شش اپ مستقل تهیه شده است؛ بنابراین:
- شمارش ۱۱ محصول و میانگین ۱۸٫۲٪ دیگر مرجع معماری نیست.
- امتیازهای ARVAND، CHARSU، GANJINEH، NEGAH، SEPEHR، NAMA و PAYAM باید با مرزهای جدید بازتفسیر شوند.
- DANA از موتور داخلی به اپ مستقل تبدیل شده است.
- CHARSU به ARMIN MARKET و PAYAM به LEADORA منتقل شده‌اند.
- چهار حوزه GANJINEH، NEGAH، SEPEHR و NAMA در شمار محصولات مستقل قرار نمی‌گیرند.
- اعداد تاریخی ماتریس حفظ می‌شوند، اما نباید به‌عنوان پیشرفت فعلی یا مبنای درصدهای جدید استفاده شوند.

### Brand & UI Pack قدیمی
فایل Library با نام `BRAND-AND-UI.md` هنوز ARVAND، CHARSU، GANJINEH، NEGAH، SEPEHR، NAMA، PAYAM و DANA را به‌صورت یک کاتالوگ تخصصی قدیمی معرفی می‌کند. این فایل باید در Source Ledger با وضعیت `SUPERSEDED_ARCHITECTURE` علامت‌گذاری شود. مرجع جاری، ساختار شش‌اپی و دامنه‌های داخلی ARIA در این ممیزی و اسناد جدید GitHub است.

### اسناد قدیمی ARIA
اسناد نسخه‌های 15.4، 15.5، 15.19، 15.20، 15.23 و 15.24 دارای تعدادهای ۱۱۵، ۱۲۰، ۲۳۱، ۲۳۲، ۳۲۹ و ۶۳۹ هستند. این اعداد به نسل‌ها و رجیستری‌های مختلف تعلق دارند. فقط ۶۳۹ شناسه Canonical در رجیستری ARIA 32 و ۲۰۱ ماژول Backend در مخزن فعلی، به‌عنوان موجودی‌های مستقل گزارش شوند؛ نسخه‌های دیگر فقط با Crosswalk و تاریخچه حفظ شوند.
