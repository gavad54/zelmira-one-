# راه‌اندازی امن پشتیبان‌گیری S3 برای VAYRO

وضعیت: راهنمای آماده‌سازی؛ هنوز هیچ سرویس، باکت یا اعتبارنامه‌ای فعال نشده است.

## محیط‌های GitHub

دو Environment مستقل در مخزن لازم است:

- `vayro-backup`: فقط برای job پشتیبان‌گیری.
- `vayro-restore`: فقط برای job بازیابی آزمایشی؛ با تأیید دستی و در صورت امکان تأیید اجباری مدیر.

مقادیر Secret در هر Environment جداگانه تعریف می‌شوند؛ بنابراین کلید backup و کلید restore باید متفاوت باشند.

## Environment: vayro-backup

Secrets:
- `VAYRO_BACKUP_DATABASE_URL`: اتصال محدود و فقط‌خواندنی به VAYRO-CORE.
- `VAYRO_S3_ACCESS_KEY_ID`: کلید اختصاصی نوشتن backup.
- `VAYRO_S3_SECRET_ACCESS_KEY`: رمز کلید اختصاصی نوشتن backup.

Variables:
- `VAYRO_BACKUP_AGE_RECIPIENT`: کلید عمومی age برای رمزگذاری.
- `VAYRO_S3_BUCKET`: نام باکت خصوصی.
- `VAYRO_S3_ENDPOINT`: نشانی HTTPS ارائه‌دهنده S3.
- `VAYRO_S3_REGION`: منطقه اعلام‌شده توسط ارائه‌دهنده.

کلید backup نباید مجوز حذف اشیا یا تغییر تنظیمات باکت داشته باشد.

## Environment: vayro-restore

Secrets:
- `VAYRO_ISOLATED_RESTORE_DATABASE_URL`: اتصال به PostgreSQL آزمایشی مستقل و خالی.
- `VAYRO_BACKUP_AGE_IDENTITY`: کلید خصوصی age برای رمزگشایی.
- `VAYRO_S3_ACCESS_KEY_ID`: کلید جداگانه فقط‌خواندنی برای دریافت backup.
- `VAYRO_S3_SECRET_ACCESS_KEY`: رمز کلید فقط‌خواندنی.

Variables:
- `VAYRO_PRODUCTION_DATABASE_HOST`: فقط نام میزبان production برای کنترل جدایی مقصد؛ بدون نام کاربری، رمز یا URL اتصال.
- `VAYRO_S3_BUCKET`
- `VAYRO_S3_ENDPOINT`
- `VAYRO_S3_REGION`

کلید restore باید فقط اجازه خواندن اشیای باکت را داشته باشد. کلید خصوصی age هرگز در مخزن یا log قرار نمی‌گیرد.

## کنترل‌های اجرا

- Backup فقط روی شاخه `main` اجرا می‌شود؛ زمان‌بندی روزانه و اجرای دستی در workflow تعریف شده است.
- Restore فقط با اجرای دستی، واردکردن کلید شیء و عبارت تأیید صریح اجرا می‌شود.
- مقصد restore باید میزبان متفاوت از production و یک دیتابیس PostgreSQL 17 خالی باشد.
- فایل رمزگذاری‌شده پیش از upload با SHA-256 همراه می‌شود؛ در restore ابتدا checksum بررسی و سپس age decrypt اجرا می‌شود.
- AWS CLI با path-style و تنظیمات checksum سازگار پیکربندی شده است.
- موفقیت upload یا وجود جدول‌ها به‌تنهایی اثبات بازیابی کامل نیست؛ شمارش رکوردها، extensionها، نقش‌ها، grantها، RLS و آزمون‌های دامنه‌ای همچنان باید بررسی شوند.

## وضعیت فعلی و ممنوعیت‌ها

در حال حاضر هیچ‌یک از موارد زیر انجام نشده است:
- انتخاب تجاری نهایی ارائه‌دهنده و تأیید هزینه؛
- ساخت حساب یا باکت؛
- ثبت Secret یا Variable در GitHub؛
- اجرای backup واقعی یا restore واقعی؛
- تغییر پایگاه داده اصلی.

تا زمان تأیید هزینه و آماده‌شدن اعتبارنامه‌ها، هیچ اجرای عملیاتی روی production انجام نمی‌شود. برای فعال‌سازی backup زمان‌بندی‌شده production نیز باید پس از یک restore آزمایشی موفق، مجوز جداگانه ثبت شود.
