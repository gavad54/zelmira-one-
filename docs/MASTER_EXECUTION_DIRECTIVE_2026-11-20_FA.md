# فرمان اجرایی مادر اکوسیستم VAYRO — نسخه ۲۰ نوامبر ۲۰۲۶

این سند، دستورهای قدیمی متناقض را برای اجرای مهندسی از این تاریخ یکپارچه می‌کند. اسناد و فایل‌های تاریخی حذف نمی‌شوند؛ این فرمان فقط مرجع جاری اجرای کار است.

## ۱. معماری غیرقابل‌ابهام

VAYRO مادر و شش اپ مستقل مستقیم آن عبارت‌اند از:
1. ARIA
2. ARIANA
3. LEADORA
4. ARMIN MARKET
5. DANA
6. ARVAND

دامنه‌های داخلی ARIA: GANJINEH، NEGAH، SEPEHR، NAMA.

CHARSU در ARMIN MARKET و PAYAM در LEADORA ادغام شده‌اند. سوابق تاریخی و شناسه‌هایشان حفظ شوند، اما به عنوان محصول مستقل جدید نمایش داده نشوند.

ARIA هیچ حسابداری، دفترکل یا ERP ندارد. ARIANA مالک انحصاری این حوزه است.

## ۲. حفظ تاریخچه و موجودی‌ها

- هیچ ماژول، موتور، قرارداد، Adapter، API یا فایل تاریخی بدون ممیزی و تأیید حذف نشود.
- ۶۳۹ Canonical archive، ۲۰۱ Backend modules، cohort تاریخی ۱۸۳ و ماتریس ۱۹۱ ردیفی Adapter بیرونی، چهار موجودی جدا هستند.
- Crosswalk باید شناسه قدیمی، شناسه جدید، فایل اجرا، تست، قرارداد، مالک، داده و وضعیت اتصال بیرونی را ثبت کند.
- نام یا تعداد فایل جایگزین قابلیت واقعی نیست.
- ماژول‌های مشابه فقط پس از مقایسه ورودی/خروجی، داده، مجوز، اثر تجاری و تست می‌توانند ادغام شوند.

## ۳. ساختار مخزن و انتشار

- VAYRO canonical repo فعلاً gavad54/zelmira-one- است؛ نام اپ در UI فقط VAYRO باشد.
- ARIA: gavad54/aria-android؛ ادغام PR #3 به main تا حل وابستگی PR/base انجام نشود.
- LEADORA: gavad54/LEADORA.
- ARMIN MARKET: gavad54/Armin_market.
- ARIANA، DANA و ARVAND نیازمند مخزن canonical مستقل هستند.
- PRهای منسوخ معماری #41 و #42 نباید ادغام شوند.
- PR #39 (hardening) و PR #45 (six-app UI/registry) با ترتیب و تست مشخص ادغام شوند؛ هیچ PR Draft به‌عنوان انتشار تلقی نشود.

## ۴. کیفیت و امنیت

- تمام تغییرات با تست رفتار، آزمون منفی، tenant isolation، authorization و lint/typecheck/build پوشش داده شوند.
- CI باید تست‌ها و build را اجرا کند حتی اگر dependency audit در پایان شکست بخورد؛ خود dependency gate همچنان blocking باقی بماند.
- هیچ advisory بدون بررسی و مدرک suppress نشود.
- از npm audit fix --force و downgrade شکسته Prisma استفاده نشود.
- effect باید به نسخه patched 3.22.1 یا بالاتر برسد؛ lockfile با نصب واقعی و آزمون کامل به‌روزرسانی شود.
- secrets، signing keys و credentials فقط در محیط‌های محافظت‌شده قرار گیرند.

## ۵. پایگاه داده و امنیت Tenant

- قبل از migration تولیدی، Prisma، live catalog و تمام migration SQLها diff شوند.
- VAYRO-CORE باید baseline معتبر، نقش‌های مجزا auth/platform/tenant/migration، grants حداقلی، RLS policyهای جدول‌به‌جدول و آزمون‌های منفی داشته باشد.
- RLS روشن بدون policy، Tenant isolation محسوب نمی‌شود.
- تا قبل از Backup خارج از Provider و Restore Drill مستقل، هیچ DDL یا migration تولیدی انجام نشود.
- از دیتابیس/Volume/credentialهای ARIA یا LEADORA برای VAYRO استفاده نشود.

## ۶. میزبانی و بازیابی

- پروژه و سرویس Railway مستقل برای VAYRO ایجاد و پیکربندی شود.
- سرویس‌های موجود VAYRO داخل ARIA Web و LEADORA خاموش‌اند؛ آنها جایگزین میزبانی مستقل نیستند.
- Backup رمزگذاری‌شده باید خارج از Provider اصلی ذخیره شود؛ upload و checksum تأیید شود.
- Restore در مقصد ایزوله با اعتبارسنجی schema، row counts و invariants انجام شود.
- RPO/RTO و روش بازیابی مستند شوند.

## ۷. عملیات واقعی و درآمد

- طراحی قیمت و entitlement، اجرای پرداخت نیست.
- پیش از درآمد واقعی، subscription lifecycle، payment webhooks، idempotency، invoice، refund، reconciliation و access revocation باید در sandbox و سپس Production آزمون شوند.
- Providerهای بیرونی باید با credential امن، timeout، retry، rate limit، health check و audit log متصل شوند.
- انتشار محتوا، ارسال پیام، سفارش، رزرو، پرداخت یا تغییر بیرونی بدون رضایت/تأیید لازم انجام نشود.

## ۸. استاندارد تکمیل محصول

هر ماژول باید شواهد جداگانه داشته باشد:
1. Domain logic اختصاصی و قرارداد ورودی/خروجی؛
2. persistence و migration؛
3. auth/authorization و tenant isolation؛
4. unit/integration/E2E؛
5. provider sandbox یا اجرای واقعی؛
6. logging، monitoring، failure recovery؛
7. قیمت/entitlement و آزمون درآمد، در صورت تجاری بودن؛
8. release evidence و UAT.

وضعیت‌ها: DESIGNED، LOCAL_EXECUTABLE، PROVIDER_VERIFIED، E2E_VERIFIED، PRODUCTION_ACTIVE، MONETIZED، BLOCKED.

## ۹. ترتیب اولویت اجرا

P0: dependency security، backup/restore، DB baseline/RLS، Railway مستقل VAYRO.

P1: تثبیت شش محصول در UI/API/اسناد، PR merge order، مخازن ARIANA/DANA/ARVAND، Crosswalk 639/183/191.

P2: E2E و Provider integration، entitlement/payment، Android release، UAT و مجوز انتشار.

## ۱۰. قواعد گزارش روزانه

- فقط وضعیت آخرین commit/branch/PR را گزارش کن.
- برای هر ادعا SHA، CI run، تست و منبع قابل مشاهده ثبت کن.
- Draft را Mergeشده و CI موفق را Production تلقی نکن.
- درصدها فقط با مخرج روشن و شواهد محاسبه شوند.
- موانع مالک‌محور، secretها و اقداماتی که نیاز به تأیید کاربر دارند صریحاً جدا شوند.
- به کاربر موبایل‌محور دستورهای کوتاه و قابل انجام با گوشی بده؛ انجام کار روی PC را فرض نکن.

**هدف نهایی: شش اپ مستقل با منطق دامنه‌ای واقعی، داده و امنیت جداگانه، اتصال API کنترل‌شده، عملیات قابل بازیابی و مدل درآمدی آزموده‌شده؛ بدون حذف تاریخچه و بدون اعلام تکمیل بی‌مدرک.**


## ۱۱. اسناد و ماتریس‌های تاریخی

- ماتریس `VAYRO_11_Product_Execution_Matrix_2026-11-18.xlsx` و فایل Library `BRAND-AND-UI.md` مربوط به معماری پیشین‌اند و نباید برای شمارش فعلی محصولات یا درصد پیشرفت استفاده شوند.
- مرجع جاری شش اپ مستقل است؛ DANA مستقل، ARVAND مستقل، CHARSU در ARMIN MARKET، PAYAM در LEADORA و چهار حوزه GANJINEH/NEGAH/SEPEHR/NAMA داخلی ARIA هستند.
- نسخه‌های مختلف رجیستری ARIA (115/120/231/232/329/639) با هم جمع نشوند. فقط Source ID و Crosswalk تعیین می‌کند هر قابلیت به کدام موجودی تعلق دارد.
- برای هر ZIP، SHA-256، versionCode/versionName، applicationId، تست، migration و build evidence ثبت شود؛ نام فایل به‌تنهایی اعتبار Source را تعیین نمی‌کند.
