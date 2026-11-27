# راه‌اندازی امن پشتیبان‌گیری S3-compatible برای VAYRO (Cloudflare R2)

وضعیت: راهنمای آماده‌سازی؛ هنوز هیچ باکت، اعتبارنامه یا پشتیبان واقعی فعال/ایجاد نشده است.

## GitHub Environments

دو Environment مستقل در مخزن لازم است:

- `vayro-backup`: فقط برای job پشتیبان‌گیری.
- `vayro-restore`: فقط برای job بازیابی آزمایشی؛ با اجرای دستی و عبارت تأیید صریح. در صورت امکان، تأیید اجباری مدیر نیز فعال شود.

مقادیر Secret در هر Environment جداگانه تعریف می‌شوند. کلید نوشتن backup و کلید فقط‌خواندنی restore باید **دو کلید مستقل** با مجوزهای متفاوت باشند. هیچ کلیدی در گفتگو یا فایل مخزن قرار نگیرد.

## Environment: vayro-backup

Secrets:
- `VAYRO_BACKUP_DATABASE_URL`: اتصال محدود و فقط‌خواندنی به VAYRO-CORE؛ فقط مجوزهای لازم برای `pg_dump`.
- `VAYRO_R2_BACKUP_ACCESS_KEY_ID`: شناسه کلید اختصاصی بارگذاری backup.
- `VAYRO_R2_BACKUP_SECRET_ACCESS_KEY`: راز همان کلید اختصاصی بارگذاری.

Variables:
- `VAYRO_BACKUP_AGE_RECIPIENT`: کلید عمومی age برای رمزگذاری.
- `VAYRO_R2_BUCKET`: نام باکت خصوصی.
- `VAYRO_R2_S3_ENDPOINT`: نشانی HTTPS endpoint مربوط به حساب R2.
- `VAYRO_R2_REGION`: مقدار region موردنیاز endpoint؛ برای R2 معمولاً `auto`.

کلید backup فقط باید مجوزهای لازم برای نوشتن و خواندن مجدد اشیای مسیر پشتیبان‌گیری را داشته باشد؛ مجوز حذف اشیا، مدیریت باکت یا دسترسی به سایر باکت‌ها داده نشود. اگر ارائه‌دهنده امکان محدودکردن دسترسی به prefix را می‌دهد، آن را به `vayro/postgres/*` محدود کنید.

## Environment: vayro-restore

Secrets:
- `VAYRO_ISOLATED_RESTORE_DATABASE_URL`: اتصال به PostgreSQL 17 آزمایشی مستقل و خالی؛ هرگز دیتابیس production نباشد.
- `VAYRO_BACKUP_AGE_IDENTITY`: کلید خصوصی age برای رمزگشایی.
- `VAYRO_R2_RESTORE_READONLY_ACCESS_KEY_ID`: شناسه کلید مستقل فقط‌خواندنی برای دریافت backup.
- `VAYRO_R2_RESTORE_READONLY_SECRET_ACCESS_KEY`: راز همان کلید فقط‌خواندنی.

Variables:
- `VAYRO_PRODUCTION_DATABASE_HOST`: فقط نام میزبان production برای کنترل جدایی مقصد؛ بدون نام کاربری، رمز یا URL اتصال.
- `VAYRO_PRODUCTION_DATABASE_NAME`: نام دیتابیس production برای رد مقصد اشتباه.
- `VAYRO_R2_BUCKET`
- `VAYRO_R2_S3_ENDPOINT`
- `VAYRO_R2_REGION`

کلید restore فقط مجوز خواندن اشیای لازم را داشته باشد و هرگز مجوز نوشتن، حذف، مدیریت باکت یا تغییر سیاست‌ها نداشته باشد. کلید خصوصی age هرگز در مخزن یا log قرار نگیرد.

## کنترل‌های اجرا و پذیرش

- Backup فقط روی شاخه `main` اجرا می‌شود؛ workflow زمان‌بندی روزانه و اجرای دستی دارد.
- Restore فقط با اجرای دستی، واردکردن کلید دقیق شیء و عبارت `RESTORE_TO_ISOLATED_VAYRO_TEST` اجرا می‌شود.
- مقصد restore باید میزبان متفاوت از production، نام دیتابیس متفاوت و PostgreSQL 17 خالی باشد.
- فایل dump پیش از بارگذاری با age رمزگذاری می‌شود؛ فایل plaintext نباید به باکت منتقل شود.
- پس از بارگذاری، اندازه اشیا بررسی و هر دو فایل رمزگذاری‌شده و sidecar دوباره از R2 دریافت می‌شوند؛ sidecar باید byte-for-byte و SHA-256 فایل رمزگذاری‌شده باید با نسخه محلی برابر باشد.
- در restore ابتدا checksum بررسی، سپس فایل رمزگشایی و با `pg_restore --exit-on-error` بازیابی می‌شود.
- پذیرش نهایی نیازمند بررسی تعداد رکوردها، extensionها، جدول‌ها، RLS، FORCE RLS، سیاست‌ها، نقش‌ها و grantها و آزمون‌های دامنه‌ای است.
- چون dump با `--no-owner --no-acl` ساخته می‌شود، مالکیت و grantها خودکار بازسازی نمی‌شوند و باید جداگانه در طرح بازیابی تعریف و آزمون شوند.
- موفقیت upload یا وجود جدول‌ها به‌تنهایی اثبات بازیابی کامل نیست.

## وضعیت فعلی و ممنوعیت‌ها

در حال حاضر هیچ‌یک از موارد زیر انجام نشده است:
- ایجاد باکت یا فعال‌سازی اعتبارنامه R2؛
- ثبت Secret یا Variable در GitHub؛
- اجرای backup واقعی، دریافت مجدد واقعی یا restore واقعی؛
- تغییر پایگاه داده اصلی یا سیاست‌های RLS؛
- تأیید هزینه یا فعال‌سازی منبع پولی.

تا زمان آماده‌شدن اعتبارنامه‌های محافظت‌شده و تأیید هزینه، هیچ اجرای عملیاتی روی production انجام نمی‌شود. فعال‌سازی backup زمان‌بندی‌شده production نیز باید پس از یک restore آزمایشی موفق و مجوز جداگانه انجام شود.
