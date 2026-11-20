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


## ممیزی مخازن و آماده‌سازی مخزن مستقل | تکمیل بررسی
- جست‌وجوی GitHub با فیلتر `user:gavad54` انجام شد؛ مخازن قابل‌دسترسی شامل `aria-android`، `aria-app`، `aria-app-1293`، `zelmira`، `zelmira-one-`، `LEADORA` و مخازن Armin بودند.
- جست‌وجوی دقیق `ariana`، `ariayana`، `ariana-app` و «آریانا» در مالکیت `gavad54` نتیجه‌ای نداشت.
- `aria-android` صریحاً خود را ARIA بدون حسابداری/ERP معرفی می‌کند؛ بنابراین به‌عنوان مخزن ARIANA انتخاب یا دستکاری نشد. `aria-app-1293` و `zelmira` خالی بودند و `aria-app` README قابل‌خواندن نداشت.
- در ابزار GitHub متصل، عملیات ساخت repository جدید در دسترس نیست؛ بنابراین ساخت مخزن آنلاین انجام‌شده اعلام نمی‌شود.
- snapshot کامل سورس بازیابی‌شده به‌همراه candidate v0.38، README مستقل، gitignore و گزارش blocker در بسته `ARIANA_v0.38_STANDALONE_REPOSITORY_BOOTSTRAP.zip` آماده شد.
- SHA-256 بسته bootstrap: `22398bed547844ab4860426678337ece5a7c2a231b871478c86ab7b9b7d51bca`.
- بسته ZIP با `unzip -t` بررسی شد و خطای ساختاری نداشت. هیچ فایلی به مخزن ARIA منتقل نشد.
- وضعیت نهایی: سورس مستقل آماده بارگذاری است؛ Repository آنلاین هنوز ایجاد نشده و به‌علت نبود عملیات create-repository در اتصال فعلی، push/CI نیز انجام نشده است.
