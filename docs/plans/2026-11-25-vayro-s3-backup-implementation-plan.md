# برنامه اجرایی: پشتیبان‌گیری مستقل VAYRO با S3

- تاریخ: 2026-11-25
- شاخه اجرا: `feat/vayro-s3-backup-implementation-2026-11-25`
- سند طراحی مبنا: `docs/specs/2026-11-25-vayro-s3-compatible-backup-design.md`
- وضعیت: پیاده‌سازی اولیه workflowها و آزمون قراردادی در شاخه مستقل انجام شده؛ اجرای واقعی backup/restore هنوز مسدود به تنظیمات و سرویس مالک است.

## قواعد غیرقابل‌مذاکره

1. همه تغییرات فقط در شاخه اجرای مستقل انجام می‌شود.
2. هیچ commit یا merge به `main` انجام نمی‌شود.
3. هیچ secret، کلید، رمز عبور یا URL حاوی اعتبارنامه در کد یا گزارش قرار نمی‌گیرد.
4. هیچ bucket، حساب پولی یا سرویس جدیدی ایجاد یا خریداری نمی‌شود.
5. هیچ دستور schema، migration، RLS، grant یا DDL روی VAYRO-CORE production اجرا نمی‌شود.
6. تمام آزمون‌های restore فقط روی PostgreSQL آزمایشی مستقل اجرا می‌شوند.
7. تا زمانی که محیط اجرای محلی/CI در دسترس نباشد، هیچ ادعای قبولی تست مطرح نمی‌شود.

## بررسی پایه و آماده‌سازی

- [ ] بررسی وضعیت شاخه و اطمینان از اینکه شاخه اجرا از commit سند طراحی منشعب شده است.
- [x] فراهم‌کردن مرزبندی ایزوله با شاخه مستقل GitHub؛ ابزار محلی Git/worktree در این نشست در دسترس نبود.
- [x] بررسی هر دو workflow و تبدیل متغیرهای ارائه‌دهنده قبلی به قرارداد عمومی `VAYRO_S3_*`.
- [ ] ثبت baseline با Node.js >=22 و نصب وابستگی‌ها.
- [ ] اجرای `npm test`, `npm run test:integration`, `npm run lint`, `npm run typecheck`, `npm run build` پیش از تغییرات؛ خطاهای baseline جداگانه ثبت شوند.

## گام 1 — قرارداد پیکربندی S3 عمومی

- [ ] طراحی helper مستقل برای اعتبارسنجی S3 endpoint (فقط HTTPS)، region، bucket، addressing style و وجود کلیدها.
- [ ] ردکردن endpoint ناامن، region خالی، bucket نامعتبر و مقادیر ناقص.
- [ ] حذف فرض‌های مختص Cloudflare از قرارداد عمومی.
- [ ] افزودن تست‌های رفتاری برای حالت معتبر، HTTP، endpoint نامعتبر، region مفقود و پیکربندی ناقص.
- [x] افزودن تست‌های قراردادی workflow و اجرای آن‌ها در CI سبز؛ ثبت شواهد اجرای قرمز مستقل/تاریخی در این مرحله موجود نیست.

## گام 2 — workflow پشتیبان‌گیری

- [x] تغییر `.github/workflows/vayro-db-backup.yml` به نام‌های عمومی `VAYRO_S3_*`.
- [ ] حفظ زمان‌بندی و اجرای دستی فعلی و محدودیت branch/environment.
- [x] تنظیم صریح path-style و گزینه‌های checksum برای AWS CLI؛ سازگاری با provider واقعی هنوز آزموده نشده است.
- [x] حفظ رمزگذاری age پیش از upload و checksum SHA-256.
- [ ] محدودکردن مجوز کلید backup به عملیات لازم؛ عدم اعطای مجوز حذف.
- [ ] اعتبارسنجی کلید object و جلوگیری از چاپ متغیرهای حساس.
- [x] افزودن بررسی اندازه object با `head-object` و گزارش خلاصه بدون اطلاعات حساس؛ این بررسی جایگزین checksum/restore نیست.
- [x] افزودن تست‌های ساختاری برای قرارداد عمومی S3، path-style، checksum، رمزگذاری و محدودیت مقصد restore.

## گام 3 — workflow بازیابی آزمایشی

- [x] تغییر `.github/workflows/vayro-db-restore-drill.yml` به تنظیمات عمومی S3.
- [ ] حفظ تأیید صریح اجرای دستی و Environment محافظت‌شده restore.
- [ ] دریافت فایل و checksum، بررسی SHA-256 و سپس رمزگشایی age.
- [x] الزام میزبان مقصد restore متفاوت از میزبان production و نام‌گذاری صریح دیتابیس آزمایشی.
- [x] حفظ شرط خالی بودن مقصد و اجرای `pg_restore --exit-on-error`.
- [ ] بررسی نسخه PostgreSQL و وجود relationها.
- [ ] افزودن کنترل‌های تکمیلی برای نقش‌ها، extensionها، RLS، شمارش رکوردها و invariantهای دامنه؛ مواردی که در dump فعلی موجود نیستند باید به‌عنوان محدودیت مستند شوند، نه اینکه موفق فرض شوند.
- [ ] تست‌های منفی برای مقصد همسان با production، مقصد غیرخالی، checksum نامعتبر و فایل رمزگشایی‌ناپذیر.

## گام 4 — مستندات و راهنمای مالک

- [ ] به‌روزرسانی راهنمای راه‌اندازی Environmentهای backup و restore.
- [ ] فهرست‌کردن Secretها و Variables بدون درخواست ارسال آن‌ها در گفتگو.
- [ ] توضیح روش ساخت کلیدهای مستقل backup/restore و چرخش امن آن‌ها.
- [ ] توضیح اینکه تنظیم Secretها فقط توسط مالک/مدیر مجاز انجام می‌شود.
- [ ] مستندسازی retention، هزینه‌ها، محدودیت‌های provider و مسیر هشدار شکست.
- [ ] تأکید بر اینکه اجرای workflow به معنی تأیید restore نیست.

## گام 5 — آزمون و شواهد

- [ ] اجرای تست‌های متمرکز S3 و workflow.
- [ ] اجرای `npm test`.
- [ ] اجرای `npm run test:integration`.
- [ ] اجرای `npm run lint`.
- [ ] اجرای `npm run typecheck`.
- [ ] اجرای `npm run build`.
- [ ] بررسی YAML workflowها و permissionها.
- [x] CI و CodeQL روی آخرین SHA اجرا و سبز شدند: `e9227003838029fb598cf120e4d89728e9d14ed3`؛ CI run `45551078289` و CodeQL run `45551078375`.
- [ ] فقط پس از فراهم‌شدن credentialهای مالک در GitHub Environment و تأیید هزینه، اجرای backup آزمایشی روی داده غیرتولیدی.
- [ ] اجرای restore آزمایشی و نگهداری شواهد checksum، نسخه PostgreSQL، شمارش‌ها و نتیجه smoke tests.

## شواهد فعلی CI

- `npm audit`: صفر آسیب‌پذیری در lockfile تولیدشده داخل runner.
- Unit tests: 93 موفق، صفر ناموفق.
- Integration tests: 30 موفق، صفر ناموفق.
- PostgreSQL role boundaries و tenant RLS: موفق روی PostgreSQL موقت CI.
- Lint، typecheck، build و Docker build: موفق.
- CodeQL: موفق.
- Artifact manifests: `vayro-dependency-remediation-manifests`؛ `effect` در lockfile برابر `3.22.1` است. این تغییر هنوز به‌صورت دائمی در `package.json` و `package-lock.json` شاخه ثبت نشده است.

## محدودیت‌های باقی‌مانده

- workflowها هنوز به سرویس S3 واقعی وصل نشده‌اند؛ اعتبارسنجی endpoint، path-style و checksum با ارائه‌دهنده واقعی انجام نشده است.
- bucket خصوصی، access keyهای محدود، age recipient/identity و GitHub Environments/Secrets/Variables ایجاد یا تنظیم نشده‌اند.
- backup واقعی، checksum از شیء واقعی، رمزگشایی واقعی و restore واقعی انجام نشده‌اند.
- dump فعلی با `--no-owner --no-acl` ساخته می‌شود؛ بنابراین بازیابی roleها و grantها از این dump تضمین نمی‌شود. پیش از پذیرش restore باید این محدودیت با روش بازیابی مناسب محیط managed PostgreSQL حل و در آزمون ثابت شود.
- پس از restore فعلی فقط نسخه PostgreSQL و وجود relationها بررسی می‌شود؛ row-count، extension، RLS و invariantهای دامنه هنوز نیازمند آزمون تکمیلی‌اند.
- وابستگی `effect@3.22.1` فقط در manifestهای Artifact تولیدشده در CI وجود دارد و باید بعداً به شکل بازبینی‌شده به شاخه commit شود.

## معیار خروج

کار فقط زمانی «پیاده‌سازی‌شده و تأییدشده» اعلام می‌شود که:
- تغییرات workflow و کد در diff قابل بازبینی باشند؛
- تست‌های لازم با خروجی تازه و موفق اجرا شده باشند؛
- CI و بررسی امنیتی موفق باشند؛
- backup رمزگذاری‌شده واقعاً در S3 بارگذاری شده باشد؛
- restore در پایگاه داده آزمایشی مستقل موفق و از نظر ساختار و داده اعتبارسنجی شده باشد.

تا آن زمان وضعیت باید «در حال اجرا»، «منتظر دسترسی/تنظیم مالک» یا «مسدود» گزارش شود. هیچ‌یک از این مراحل مجوز تغییر پایگاه داده اصلی یا انتشار production نیست.
