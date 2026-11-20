# ARIANA v0.38 — اجرای نامزد مالیات شرکتی و بودجه | 2026-11-20

## بازیابی و یافته
آرشیو `/ARIA/آریانا/ariaana_android_app_v37_hardened_integrated.zip` نسخه 0.37.0 مبنای کار قرار گرفت. جست‌وجوی مستقیم سورس نشان داد:
- مالیات/بیمه در `index_v32.js`، `backend/app/modules/tax/engine.py` و `/compliance/tax/prepare` وجود داشته، اما TaxEngine فقط PREPARED_FOR_REVIEW برمی‌گرداند.
- `TaxDocument` صرفاً سند ساده است؛ پرونده مستقل مالیات عملکرد شرکت و کارپوشه خدمات مالیاتی مشتریان موجود نبود.
- بودجه در UI نسخه v32 محاسبه سمت مرورگر بوده و به برنامه بودجه، ردیف‌های حساب/دوره و actual-vs-budget دفترکل متصل نبود.
- اسناد معماری نسخه 0.29 و ARCHITECTURE دامنه بودجه، جریان نقد و مالیات را پیش‌بینی کرده بودند.

## Candidate v0.38
فایل‌های candidate:
- `backend/app/models/entities.py`: CorporateTaxCase, TaxServiceEngagement, BudgetPlan, BudgetLine
- `backend/app/services/tax_budget.py`: منطق ایجاد پرونده مالیاتی، خدمات مالیاتی، بودجه و انحراف
- `backend/app/api/routes.py`: endpointهای `/tax/corporate-cases`, `/tax/services`, `/budgets`, budget lines, variance و approval
- `backend/MIGRATION_V38_TAX_BUDGET.sql`
- `test_v38_tax_budget.py`

## کنترل‌ها
- Tenant scope در همه queryها و کنترل تعلق حساب به شرکت اعمال شده.
- نرخ مالیاتی hard-code نشده؛ نرخ اختیاری فقط با ورودی صریح پذیرفته می‌شود.
- بدون `rule_version` و `legal_source` پرونده در `NEEDS_RULE_VALIDATION` می‌ماند.
- هیچ اظهارنامه‌ای ارسال نمی‌شود و هیچ انطباق قانونی ادعا نمی‌شود.
- actual بودجه فقط از اسناد POSTED خوانده می‌شود.
- بودجه فقط پس از ارسال برای تأیید و نقش OWNER/ADMIN قابل تأیید است.
- migration آماده است اما روی هیچ DB زنده‌ای اجرا نشده است.

## شواهد آزمون
- 5 تست جدید PASS.
- کل تست‌های آرشیو: **94 passed**.
- compileall backend: PASS.
- node --check index_v37.js: PASS.
- import کامل FastAPI app در محیط بررسی به علت نبود dependency محیطی `passlib` اجرا نشد؛ route registration و HTTP integration هنوز تأیید نشده‌اند.

## محدودیت‌های release
UI هنوز به endpointهای جدید متصل نشده است. migration، backup/restore، staging، تولید، tax rule packs رسمی، پرتال خدمات مالیاتی، هزینه‌یابی مرکز هزینه روی journal lines، گزارش‌های budget-vs-actual با sign convention حساب‌ها و Android signed build باقی‌اند. Canonical GitHub repo مستقل ARIANA هنوز تأیید نشده است.

## بسته candidate
فایل ZIP ساخته‌شده در محیط کار:
`ARIANA_v0.38_TAX_BUDGET_CANDIDATE.zip`
SHA-256: `38b5974644ae4ab34df61fbf405a717f959cd320333873686cca8f784737c74a`

این PR فقط گزارش مهندسی و شواهد را ثبت می‌کند؛ بسته candidate هنوز به مخزن مستقل ARIANA منتقل نشده و این تغییر به معنی deploy یا release نیست.
