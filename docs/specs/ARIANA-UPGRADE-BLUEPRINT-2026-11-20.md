# ARIANA — نقشه ارتقای معماری، ERP و UX | 2026-11-20

## منبع معتبر و وضعیت
- آرشیو منبع در Library: `/ARIA/آریانا/ariaana_android_app_v37_hardened_integrated.zip`
- SHA-256 تأییدشده: `a9a4146a57e899c04939728bc9669d81145d8a6f8789b7e8a807ff08e3fa6ccb`
- ZIP integrity: PASS؛ 385 entries.
- محصول: ARIANA / آریانا؛ Android package: `ir.aria.hesab`؛ versionCode 37 / versionName 0.37.0.
- منبع کانونی GitHub مستقل هنوز پیدا نشده؛ آرشیو موجود است، اما canonical repo و production deployment تأیید نشده‌اند.
- گزارش ممیزی 2026-11-09: 89 تست منبع اولیه PASS؛ candidate سخت‌سازی جداگانه 94 تست PASS و 11/11 asset readiness؛ candidate هنوز commit مخزن یا deploy نشده است.
- APK/AAB و امضای انتشار در آرشیو نیست؛ Android build/device install در محیط ممیزی اجرا نشده است.

## معماری واقعی مشاهده‌شده
- Android WebView shell با PWA/HTML/JS در app/src/main/assets.
- FastAPI/Python backend، SQLAlchemy، مدل‌های داده، PostgreSQL schema starter، Docker Compose.
- API routes، domain engines، automation/workforce workflows، AI/CFO/voice, revenue services.
- دامنه‌ها شامل accounting/posting، sales، purchases، inventory، treasury، payroll، assets، tax، insurance، projects، production، banking reconciliation و licensing.
- سند ARCHITECTURE.md خودش این بسته را prototype موبایل/PWA معرفی می‌کند و production backend/database/auth/integrations را نیازمند تکمیل می‌داند.

## مقصد محصول
ARIANA محصول مستقل و تنها مرجع حسابداری، مالی و ERP در خانواده VAYRO است. هیچ حسابداری، دفترکل یا ERP به ARIA منتقل نشود.

## معماری هدف
1. Identity, MFA, RBAC, SoD, session lifecycle و tenant membership.
2. Tenant/Company/Branch/Period و master data.
3. Accounting Core: chart of accounts، journal، double-entry، posting، period lock، reverse/adjustment.
4. Sales/Receivables و Purchase/Payables.
5. Inventory, costing, warehouse, batch/serial.
6. Treasury, bank, cash, cheque, reconciliation.
7. Payroll, fixed assets, projects, contracts, production.
8. Tax & Insurance rule registry نسخه‌دار و تاریخ‌دار.
9. Workflow/Approval/Maker-Checker.
10. Audit/Evidence/Risk/Controls.
11. Reports/BI/CFO intelligence.
12. AI/Voice proposal engine.
13. API Gateway, event/outbox, PostgreSQL, object storage, backup/DR.

در MVP معماری modular monolith باقی بماند؛ استخراج سرویس‌ها فقط با شواهد نیاز مقیاس و هزینه عملیاتی.

## UX و طراحی
- Task-first و mobile-first؛ دو حالت «ساده برای صاحب کسب‌وکار/کاربر غیرحسابدار» و «حرفه‌ای برای حسابدار/مدیر مالی».
- خانه نقش‌محور: کارهای امروز، نقدینگی، فروش/خرید در انتظار، هشدارهای مهم، مغایرت‌ها و وضعیت سلامت عملیات.
- ورود صوتی/متنی به‌عنوان مسیر سریع؛ تشخیص intent و پیش‌نمایش عملیات قبل از ثبت.
- جریان سند: ثبت داده → پیشنهاد حساب/کدینگ → کنترل توازن و دوره → preview → تأیید مجاز → posting → audit trace.
- صفحات تخصصی برای دفترکل، خزانه، بانک، فروش، خرید، انبار، تولید، حقوق، دارایی، مالیات و گزارش.
- جداول دارای فیلتر/جست‌وجو/خروجی، نمایش منبع هر عدد و drill-down از گزارش تا سند.
- Import Excel با mapping، پیش‌نمایش، اعتبارسنجی، گزارش خطا و rollback؛ هیچ import خام مستقیماً posting نکند.
- فارسی RTL کامل، انگلیسی LTR آماده، دسترس‌پذیری، فونت خوانا، حالت‌های loading/empty/error/offline/success.
- یک design system مشترک با tokenهای رنگ/فاصله/typography، اما صفحه‌ها بر اساس وظیفه و نقش طراحی شوند؛ از داشبورد شلوغ پرهیز شود.

## Benchmark داخلی و خارجی
- داخلی: سپیدار برای حسابداری/انبار/فروش/دریافت‌وپرداخت؛ پایا/پایدار پایا برای گردش‌کار و کارتابل؛ اوراش برای سادگی کاربری، گزارش و Excel/API.
- خارجی: Odoo برای navigation و workflow یکپارچه؛ Zoho Books/Inventory برای پیوستگی سند و موجودی؛ ERPNext برای سادگی مدل دامنه و modularity.
- اقتباس فقط از اصول قابل مشاهده عمومی؛ نه کپی UI/کد و نه ادعای برابری قابلیت‌ها بدون تست.

## ریسک‌های قطعی منبع v0.37 که باید پیش از release بسته شوند
- docker-compose قدیمی دارای مقادیر secret نمونه و JWT placeholder؛ production باید fail closed کند.
- JWT بدون session revocation/rotation کامل، MFA و email verification gate اثبات‌شده.
- readiness asset path در ممیزی اولیه اشتباه بود؛ candidate آن را اصلاح کرده است.
- version mismatch در health endpoint در candidate اصلاح شده است.
- create_all در import-time؛ migration chain و rollback تولیدی هنوز اثبات نشده.
- tenant_id در مدل‌ها به‌تنهایی اثبات isolation نیست؛ route/service/query/export/file باید tenant-aware تست شود و DB-level control بررسی شود.
- journal numbering مبتنی بر max+1 در مسیرهای خاص؛ unique constraint، concurrency serialization و idempotency لازم است.
- tax/insurance rules باید با منابع رسمی و کارشناس ذی‌صلاح تطبیق داده شوند.
- backup/restore، email/payment integrations، monitoring و Android signed release اثبات نشده‌اند.

## اصول مالی غیرقابل‌تغییر
- هر سند نهایی باید متوازن باشد؛ دوره بسته posting نپذیرد.
- سند ثبت‌شده حذف یا بی‌ردپا بازنویسی نشود؛ reverse/adjustment.
- Maker-Checker برای عملیات حساس و دسترسی تفکیک‌شده.
- قوانین مالیاتی/بیمه‌ای نسخه‌دار، تاریخ‌دار و قابل ردیابی.
- هر تراکنش از مبدأ تا گزارش Financial Trace ID داشته باشد.
- AI فقط پیشنهاددهنده؛ پرداخت، posting نهایی، بستن دوره و اظهار رسمی با تأیید مسئول مجاز.

## برنامه اجرا
P0: import دقیق آرشیو و ثبت hash، ایجاد canonical private repo، fail-closed secrets، session/MFA، tenant authorization، migrations، backup/restore.  
P1: اصلاح navigation/role dashboards، workflow اسناد، بانک/خزانه، import/export و audit.  
P2: payroll/assets/tax/insurance، تولید/پروژه و گزارش‌های مدیریتی.  
P3: voice/CFO AI، اتصال رسمی بانکی/مالیاتی، اتوماسیون با approval.  
P4: Android wrapper build، تست دستگاه، signing، UAT و release gates.

## معیار پذیرش
- حفظ همه قابلیت‌های آرشیو v0.37 و همه نسخه‌های تاریخی؛ هر حذف/ادغام فقط با crosswalk و تأیید مالک.
- تمام APIها/routeها دارای authorization و tenant tests.
- double-entry، period lock، concurrent posting، idempotency و audit tests.
- migration forward/rollback روی staging و restore drill مستقل.
- نسخه قوانین و محاسبات مالیاتی/بیمه‌ای با مرجع رسمی.
- Android build + device test + signed release.
- هیچ قابلیت نمایشی/fixture به‌عنوان اتصال واقعی معرفی نشود.

## منابع داخلی/خارجی
- آرشیو v0.37 و گزارش ممیزی منبع ARIANA در VAYRO repo: docs/operations/ARIANA-SOURCE-AUDIT-2026-11-09.md
- Benchmark sources داخل آرشیو: BENCHMARK_SOURCES_FA.md
- Odoo accounting UX: https://odoocdn.com/openerp_website/static/src/pdf/WP/whitepaper-2023-accounting.pdf
- Zoho Inventory UX: https://files-accl.zohoexternal.com/public/workdrive-external/download/3jvid8c5d1281c42c4c0d9098451ebb9253aa
- Odoo vs ERPNext: https://www.erpresearch.com/compare/odoo-vs-erpnext

**وضعیت:** SOURCE_ARCHIVE_LOCATED / CANONICAL_REPO_NOT_LOCATED / NOT_RELEASED.


## اجرای مجدد آزمون آرشیو در 2026-11-20
- آرشیو اصلی از Library در محیط ایزوله استخراج شد؛ `ZipFile.testzip()` بدون خطا بود.
- `python -m pytest -q`: **89 passed** در 1.69 ثانیه.
- `python -m compileall -q backend`: exit code 0.
- `node --check` برای 6 فایل JavaScript در assets: همگی بدون خطای syntax.
- این آزمون‌ها فقط صحت بخشی از سورس آرشیو را در محیط ایزوله نشان می‌دهند؛ build اندروید، اتصال production، امنیت tenant، migration زنده، backup/restore، signing و UAT همچنان اثبات نشده‌اند.
