# ARIANA v0.38 — اجرای نامزد مالیات شرکتی و بودجه | 2026-11-20

## بازیابی و یافته
آرشیو `/ARIA/آریانا/ariaana_android_app_v37_hardened_integrated.zip` نسخه 0.37.0 مبنای کار قرار گرفت. جست‌وجوی مستقیم سورس نشان داد:
- مالیات/بیمه در `index_v32.js`، `backend/app/modules/tax/engine.py` و `/compliance/tax/prepare` وجود داشته، اما TaxEngine فقط PREPARED_FOR_REVIEW برمی‌گرداند.
- `TaxDocument` صرفاً سند ساده است؛ پرونده مستقل مالیات عملکرد شرکت و کارپوشه خدمات مالیاتی مشتریان موجود نبود.
- بودجه در UI نسخه v32 محاسبه سمت مرورگر بوده و به برنامه بودجه، ردیف‌های حساب/دوره و actual-vs-budget دفترکل متصل نبود.
- اسناد معماری نسخه 0.29 و ARCHITECTURE دامنه بودجه، جریان نقد و مالیات را پیش‌بینی کرده بودند.

## Candidate v0.38 — Backend و UI
- `backend/app/models/entities.py`: CorporateTaxCase, TaxServiceEngagement, BudgetPlan, BudgetLine
- `backend/app/services/tax_budget.py`: منطق پرونده مالیاتی، خدمات مالیاتی، بودجه، انحراف و فهرست tenant-scoped بودجه‌ها
- `backend/app/api/routes.py`: endpointهای پرونده مالیاتی، خدمات مالیاتی، بودجه، ردیف‌ها، variance و approval؛ به‌علاوه `GET /budgets`
- `backend/MIGRATION_V38_TAX_BUDGET.sql`
- `test_v38_tax_budget.py`
- `app/src/main/assets/index_v38.js`: رابط فارسی برای ورود امن، پرونده مالیات شرکتی، خدمات مالیاتی، ایجاد بودجه، ردیف بودجه، گزارش انحراف و تأیید مالک/مدیر
- `app/src/main/assets/index.html`: بارگذاری اسکریپت v38 و CSP با `connect-src 'self'`؛ ارتباط فقط با همان مبدأ مجاز است.

## کنترل‌ها
- Tenant scope در queryها و کنترل تعلق حساب به شرکت اعمال شده.
- نرخ مالیاتی hard-code نشده؛ نرخ اختیاری فقط با ورودی صریح پذیرفته می‌شود و وجود منبع/نسخه قانونی به‌تنهایی اثبات صحت مقررات نیست.
- پرونده فاقد rule provenance در `NEEDS_RULE_VALIDATION` می‌ماند؛ منبع مقررات باید توسط مرجع معتبر/کارشناس بررسی شود.
- هیچ اظهارنامه‌ای ارسال نمی‌شود و هیچ انطباق قانونی ادعا نمی‌شود.
- توکن API فقط در sessionStorage نگهداری می‌شود؛ API با Bearer token فراخوانی می‌شود.
- actual بودجه فقط از اسناد POSTED خوانده می‌شود.
- بودجه فقط پس از ارسال برای تأیید و نقش OWNER/ADMIN قابل تأیید است.
- migration آماده است اما روی هیچ DB زنده‌ای اجرا نشده است.

## شواهد آزمون
- 6 تست متمرکز v0.38 PASS؛ شامل فهرست بودجه‌ها با جداسازی tenant.
- کل تست‌های آرشیو: **95 passed**.
- `python -m compileall -q backend`: PASS.
- `node --check` برای فایل‌های JS نسخه‌های v32، v34، v35، v36، v37 و v38: PASS.
- کنترل قراردادی UI/API: PASS.
- تست جدید فهرست بودجه‌ها ابتدا به دلیل نبود تابع `list_budgets` با خطای مورد انتظار RED شد؛ پس از پیاده‌سازی همان تست GREEN شد.
- import کامل FastAPI app در محیط بررسی به علت نبود dependency محیطی `passlib` اجرا نشد؛ route registration و HTTP integration هنوز تأیید نشده‌اند.

## محدودیت‌های release
- Canonical GitHub repo مستقل ARIANA هنوز تأیید نشده؛ کد به مخزن محصول منتقل نشده است.
- migration، backup/restore، staging، production، tax rule packs رسمی، اعتبارسنجی حقوقی، آزمون HTTP یکپارچه، اجرای Android/WebView و Android signed build باقی‌اند.
- تفکیک عملکرد مرکز هزینه تا زمانی که journal lines برچسب مرکز هزینه نداشته باشند محدود است.
- این خروجی یک candidate محلی است؛ deploy یا release محسوب نمی‌شود.

## بسته candidate یکپارچه
فایل: `ARIANA_v0.38_TAX_BUDGET_UI_CANDIDATE.zip`
SHA-256: `5e0b547b2510e554970c4d0ca9c04a01f45066eb39c3400750f7c8b9c7e31c48`

این PR فقط گزارش مهندسی و شواهد را ثبت می‌کند؛ بسته candidate هنوز به مخزن مستقل ARIANA منتقل نشده و این تغییر به معنی deploy یا release نیست.
