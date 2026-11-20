# فرمان ارتقای چهار محصول و حفاظت ARIA — 2026-11-20

## دامنه و قواعد
درخواست مالک: ارتقای ساختاری و طراحی ARIANA، LEADORA، ARMIN MARKET و ARVAND با الگوبرداری تحلیلی از نمونه‌های داخلی/بین‌المللی. ARIA باید بدون حذف ساختار، ماژول‌ها، شناسه‌ها، آداپتورها، موتورهای درآمدی، داده یا تاریخچه حفظ شود. حسابداری و ERP فقط در ARIANA است. محصولات مستقل، دیتابیس/هویت/چرخه انتشار مستقل دارند و فقط از API نسخه‌دار، scoped identity، consent، idempotency و audit استفاده می‌کنند. هیچ حذف یا مهاجرت مخرب بدون crosswalk، backup/restore، rollback و تأیید مالک انجام نمی‌شود.

## وضعیت مخازن بررسی‌شده
- LEADORA: gavad54/LEADORA؛ main SHA در زمان بررسی: 7bfebf39766cc5fbdf135489eb0d6127f6ae4e2c. FastAPI/Python، SQLite، رابط بزرگ یک‌فایلی app/static/index.html و دامنه‌های app/*.py. README و docs/ARCHITECTURE_FA.md در توصیف قابلیت‌های موجود یکسان نیستند؛ باید با کد و تست تطبیق داده شوند.
- ARMIN MARKET: gavad54/Armin_market؛ main SHA: 79176682f8daedb7a5f9ea8d55ec349f5aea9fc5. Android/Kotlin/Compose اولیه؛ README وجود backend، DB، حساب، فروشنده، سفارش و پرداخت عملیاتی را تأیید نمی‌کند. docs/PRODUCT_SPEC_FA.md مرجع پذیرش درخواست‌محور است.
- ARIANA: مخزن مستقل در مسیر عمومی gavad54/ARIANA یافت نشد؛ SOURCE_NOT_LOCATED. هیچ کد/مخزن فرضی نسبت داده نشود.
- ARVAND: مخزن مستقل قابل‌تأیید در مسیرهای بررسی‌شده یافت نشد؛ دامنه هدف در این سند ثبت است و پیش از تغییر کد باید repo معتبر شناسایی شود.

## ARIANA — مقصد ارتقا
ERP/حسابداری مستقل و مناسب حسابدار و کاربر غیرحسابدار: دفترکل دوطرفه و اسناد متوازن، دوره مالی و بستن دوره، اصلاحیه غیرقابل‌حذف، فروش/خرید، دریافت‌وپرداخت، خزانه/بانک/صندوق، انبار و بهای تمام‌شده، دارایی ثابت، حقوق، مالیات و گزارش‌ها؛ چندشرکتی/چندشعبه‌ای/چندارزی، tenant isolation، RBAC، audit trail، import/export کنترل‌شده. تجربه دوحالته ساده/حرفه‌ای، راهنمای زمینه‌ای و اعتبارسنجی قبل از ثبت. AI صرفاً پیشنهاد/تطبیق/کشف ناهنجاری؛ ثبت سند، پرداخت و بستن دوره با مجوز و تأیید انسانی. ثبت مالی قطعی فقط با سند اصلاحی قابل ردگیری اصلاح شود.

## LEADORA — مقصد ارتقا
سامانه عملیات توزیع و فروش B2B، نه دفترکل حسابداری: CRM و مشتریان، کاتالوگ/SKU و قیمت‌گذاری، پیش‌فاکتور/سفارش، خرید/تأمین، چندانباره و گردش موجودی، رزرو/انتقال/شمارش، pick-pack، بارگیری، مسیر توزیع، تحویل و proof-of-delivery، مرجوعی و پشتیبانی. داشبوردهای نقش‌محور مالک/عملیات/فروش/انبار/تدارکات/پخش، PWA موبایل‌محور و صف آفلاین امن با conflict handling و idempotency. KPIها باید فرمول و drill-down تا سند مبنا داشته باشند. پیش‌بینی و پیشنهاد سفارش AI فقط با داده معتبر و approval. دفترکل، صورت مالی و بستن دوره متعلق به ARIANA است؛ اتصال با API مجاز، بدون DB مشترک.

## ARMIN MARKET — مقصد ارتقا
بازارگاه درخواست‌محور سه‌طرفه (خریدار، فروشنده/تأمین‌کننده، اپراتور). خریدار: ثبت نیاز مرحله‌ای، پیشنهادهای رقابتی، مقایسه قیمت/زمان/شرایط/اعتبار، گفتگو و پیگیری. فروشنده: onboarding تدریجی، پروفایل و دسته/محدوده، صندوق درخواست‌های مرتبط، پیشنهاد استاندارد، داشبورد بازدید/درخواست/نرخ انتخاب. اپراتور: moderation، گزارش تخلف، اعتراض، مدیریت دسته/تعرفه/تبلیغ و audit. جست‌وجوی برجسته، autocomplete، فیلترهای مرتبط، trust signals قابل‌اثبات، تبلیغ برچسب‌دار و وضعیت سفارش روشن. Android Compose حفظ شود؛ backend/API/DB/storage فقط پس از طراحی و آزمون. پرداخت و custody وجه در MVP فعال نشود تا مجوز، بازپرداخت و حل اختلاف تأیید شود.

## ARVAND — مقصد ارتقا
تجارت داخلی و بین‌المللی/واردات/صادرات: پرونده معامله، طرف‌های تجاری، استعلام و پیشنهاد، قرارداد و milestone، کالا و طبقه‌بندی با منبع معتبر، کشور مبدأ/مقصد، Incoterms، اسناد نسخه‌دار، محموله/حمل/بیمه/گمرک/ترخیص/مجوز، هزینه جانبی و رهگیری. landed cost و سودآوری با نرخ ارز و منبع/زمان مشخص؛ خروجی مالی به ARIANA با mapping و تأیید. هشدار تطبیق و مقررات فقط با منابع رسمی و به‌روز؛ اظهارنامه، پرداخت گمرکی و تعهد حقوقی بدون مجوز و تأیید انسانی خودکار نشود.

## قفل حفظ ARIA
ARIA مستقل، اجتماعی/ارتباطی/خدماتی و listing-based باقی می‌ماند؛ حسابداری/دفترکل/ERP ممنوع. ساختار و 639 شناسه ثبت‌شده، آداپتورها، موتورهای درآمدی و قابلیت‌های غیرتکراری حذف یا کوچک نشوند. تغییر ARIA فقط با inventory کامل، crosswalk و regression tests. مرجع تجربه قبلی ARIA 15.6.0 شامل خانه مرجع، ورودی صوتی، «همیشه کنار شما»، «درآمدساز شو» و جریان NEXUS است؛ این مأموریت چهار محصول مجوز تغییر کد ARIA نیست.

## الگوهای benchmark
ARIANA: Odoo، Zoho Books، ERPNext (ثبات رابط، سلسله‌مراتب و workflow مالی). LEADORA: Dynamics 365، SAP Business One، Infor و Zoho Inventory (عملیات توزیع و موجودی). ARMIN MARKET: Shopify و الگوهای marketplace دوطرفه (کشف، seller tools، اعتماد و moderation). ARVAND: ASYCUDA و سامانه‌های Global Trade Management (اسناد، رهگیری و تطبیق). فقط اصول قابل اقتباس؛ نه کپی UI/کد یا ادعای قابلیت بدون پیاده‌سازی.

## گیت‌های اجرایی
1. ثبت repo/branch/SHA و بازیابی آرشیو هر محصول.
2. استخراج همه درخواست‌های قبلی به Requirement IDs و تعیین آخرین تصمیم معتبر.
3. inventory کامل UI/API/schema/jobs/integrations/tests/deploy.
4. crosswalk قابلیت‌های موجود قبل از تغییر؛ بدون حذف بی‌تأیید.
5. UX flows، design system و acceptance criteria.
6. اجرا در branch مستقل، تست واحد/یکپارچه/E2E/security/accessibility.
7. backup و restore مستقل پیش از هر تغییر داده‌ای؛ rollback.
8. PR مجزا برای هر محصول؛ merge/deploy فقط با تأیید مالک.
9. گزارش با SHA، مسیر فایل، CI/test run و شواهد.

## منابع
- Odoo accounting UX: https://odoocdn.com/openerp_website/static/src/pdf/WP/whitepaper-2023-accounting.pdf
- Zoho Inventory UX: https://files-accl.zohoexternal.com/public/workdrive-external/download/3jvid8c5d1281c42c4c0d9098451ebb9253aa
- Distribution ERP: https://softwareconnect.com/roundups/best-distribution-erp-software/
- ASYCUDA 2025: https://unctad.org/system/files/official-document/dtlasycuda2025d1_en.pdf
- Marketplace UX: https://www.lowcode.agency/blog/marketplace-ui-ux-design-best-practices-full-guide
- ARMIN MARKET spec: https://github.com/gavad54/Armin_market/blob/main/docs/PRODUCT_SPEC_FA.md
