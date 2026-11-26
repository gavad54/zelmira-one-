# راهنمای کوتاه مالک برای فعال‌سازی پشتیبان مستقل VAYRO در Cloudflare R2

این راهنما فقط دو اقدام مالک را پوشش می‌دهد که ابزارهای متصل فعلی اجازه انجام امن آن‌ها را از طرف مالک نمی‌دهند. هیچ رمز، کلید خصوصی یا نشانی اتصال پایگاه داده را در چت یا فایل مخزن قرار ندهید.

## وضعیت فعلی

- گردش‌کارهای GitHub برای مقصد Cloudflare R2 در شاخه توسعه PR شماره ۴۷ آماده شده‌اند.
- اتصال Cloudflare در حال حاضر خطای «Please enable R2 through the Cloudflare Dashboard» می‌دهد؛ بنابراین R2 هنوز برای حساب فعال نیست.
- تا فعال‌شدن R2، ایجاد Bucket و آزمایش اتصال ممکن نیست.
- هیچ پشتیبان واقعی یا Restore موفقی ثبت نشده است.

## اقدام اول: فقط فعال‌سازی R2

1. با همان حساب مالک وارد https://dash.cloudflare.com/ شوید.
2. از منوی داشبورد، **R2 Object Storage** را باز کنید.
3. اگر صفحه فعال‌سازی/شروع نمایش داده شد، مراحل فعال‌سازی R2 را تکمیل کنید.
4. اگر Cloudflare برای فعال‌سازی، افزودن روش پرداخت یا تأیید هزینه درخواست کرد، قبل از تأیید، مبلغ و شرایط را بررسی کنید. هیچ پرداخت یا ارتقای پولی را بدون اطلاع و موافقت مالک انجام ندهید.
5. پس از فعال‌شدن، همین راهنما را دوباره برای عامل مهندسی ارسال کنید تا وجود R2 بررسی و Bucket ساخته شود.

نام Bucket پیشنهادی: `vayro-core-backups`.
محدوده ذخیره‌سازی پیشنهادی: `EU`، در صورت پشتیبانی حساب و سازگاری با الزامات نگهداری داده.

## اقدام دوم: اتصال امن GitHub (پس از ساخت Bucket)

این مقادیر باید فقط در GitHub Repository Settings ثبت شوند؛ نه در چت، نه در کد و نه در فایل‌های مخزن.

مسیر: مخزن GitHub → **Settings** → **Environments**.

دو Environment با نام‌های دقیق زیر لازم است:
- `vayro-backup`
- `vayro-restore`

مقادیر مشترک:
- Secret: `VAYRO_R2_ACCESS_KEY_ID`
- Secret: `VAYRO_R2_SECRET_ACCESS_KEY`
- Variable: `VAYRO_R2_BUCKET` = `vayro-core-backups`
- Variable: `VAYRO_R2_S3_ENDPOINT` = آدرس S3 API اختصاصی حساب که Cloudflare نمایش می‌دهد؛ معمولاً قالب آن `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` است.
- Variable: `VAYRO_R2_REGION` = `auto`

Environment `vayro-backup`:
- Secret: `VAYRO_BACKUP_DATABASE_URL`
- Variable: `VAYRO_BACKUP_AGE_RECIPIENT`

Environment `vayro-restore`:
- Secret: `VAYRO_BACKUP_DATABASE_URL`
- Secret: `VAYRO_ISOLATED_RESTORE_DATABASE_URL` (باید به PostgreSQL 17 ایزوله و مستقل از میزبان Production اشاره کند)
- Secret: `VAYRO_BACKUP_AGE_IDENTITY`

کلیدهای R2 را با حداقل مجوز لازم و محدود به همان Bucket بسازید. کلید خصوصی age برای رمزگشایی باید محرمانه بماند و با دسترسی‌های R2 یکی نیست. اگر ایجاد و ثبت این مقادیر دشوار است، از یک فرد مورد اعتماد و دارای دسترسی مالک کمک بگیرید؛ آن‌ها را برای ChatGPT ارسال نکنید.

## معیار پایان

فقط پس از همه موارد زیر می‌توان دروازه Backup/Restore را PASS کرد:
1. Bucket خصوصی R2 وجود داشته باشد.
2. گردش‌کار Backup اجرا شود و فایل رمزگذاری‌شده، checksum و metadata را در R2 ثبت و بررسی کند.
3. فایل از R2 در یک میزبان/پایگاه داده PostgreSQL 17 ایزوله بازیابی شود.
4. مقایسه schema، تعداد ردیف‌ها، مالکیت/مجوزها، RLS و invariantهای کاربردی انجام و مستند شود.
5. شواهد اجرا و Restore در مخزن ثبت شود.

**هشدار:** گردش‌کار فعلی dump با `--no-owner --no-acl` می‌گیرد و Restore اولیه آن به‌تنهایی مالکیت، ACL، نقش‌های سراسری، RLS یا برابری تعداد ردیف‌ها را اثبات نمی‌کند. موفقیت این گردش‌کار، به‌تنهایی مجوز Migration یا تغییر Production نیست.
