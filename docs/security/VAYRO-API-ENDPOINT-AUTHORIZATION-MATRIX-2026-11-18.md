# ممیزی امنیتی API و ماتریس دسترسی Endpoint به Endpoint — VAYRO
**تاریخ:** 2026-11-18  
**مخزن:** `gavad54/zelmira-one-`  
**شاخه:** `engineering/vayro-hardening-2026-11-18`  
**Commit مبنای کد پس از اصلاحات:** `cefae369dfe975068a5006e32187d61645d1ecc6`  
**Commit آزمون قرمز اولیه:** `ac5a2390bd5ad7c00b85bf7099a1708ac158ad59`  
**Commit اصلاح login:** `7e34dc6a2a68c879dcf76e8fa612ab5fdcc3cccb`  
**Commit آزمون و مرزبندی DANA:** `7560e0cb0ee051697477260aff8fd337bc8cee88` / `cefae369dfe975068a5006e32187d61645d1ecc6`  
**محدوده:** تمام مسیرهای `src/app/api/**/route.ts`، میان‌افزار، auth/session/MFA، owner/platform transaction، tenant authorization/transaction و تست‌های مرتبط.

## 1. خلاصه ممیزی
در شاخه مبنا **۳۷ فایل Route و ۴۹ عملیات HTTP** شناسایی شد. هر عملیات بر اساس هویت، نشست، سطح MFA، مجوز Tenant، کنترل‌های درخواست، محدودیت نرخ، ثبت رویداد و شواهد آزمون بررسی شده است.

این سند ممیزی کد و تست CI است؛ تأیید Production نیست. در زمان ممیزی، دیتابیس زنده VAYRO-CORE دارای ۱۱ جدول RLS-enabled و صفر policy، بدون migration history و بدون نقش‌های اختصاصی runtime مشاهده شده بود. بنابراین حتی endpointهایی که در CI ایزوله آزمون می‌شوند، تا رفع موانع دیتابیس، مجاز به بهره‌برداری Production نیستند.

## 2. ماتریس دسترسی کامل
| # | Method | Endpoint | هویت مجاز | نشست و MFA | دامنه Tenant | کنترل‌های موجود و شواهد | شکاف/اقدام تکمیلی |
|---:|---|---|---|---|---|---|---|
| 1 | GET | `/api/ai-business-suite/capabilities` | عمومی؛ بدون نشست | ندارد | ندارد | فهرست قابلیت‌ها و فیلترها؛ فقط خواندنی؛ Cache عمومی؛ آزمون کاتالوگ عمومی موجود | DANA در مجموعه PRODUCTS ظاهر می‌شود؛ با مرز معماری ناسازگار |
| 2 | POST | `/api/auth/change-password` | کاربر صاحب نشست خودش | نشست فعال + رمز فعلی؛ MFA تازه برای OWNER/ADMIN یا حساب MFAدار | خود کاربر؛ بدون Tenant | Same-Origin، محدودیت IP/کاربر، بررسی نشست در تراکنش، ابطال همه نشست‌ها، Audit؛ آزمون ورودی/Origin و مسیرهای احراز هویت؛ آزمون موفق کامل این مسیر جداگانه لازم است | پذیرش مسیر موفق، نشست همزمان و MFA step-up جداگانه |
| 3 | POST | `/api/auth/forgot-password` | عمومی؛ ایمیل معتبر | بدون نشست؛ لینک PASSWORD_RESET یک‌بارمصرف | حساب هدف؛ بدون Tenant | محدودیت IP و ایمیل؛ پاسخ عمومی 202 برای جلوگیری از enumeration؛ لینک ۳۰ دقیقه؛ پوشش مستقیم HTTP در مجموعه تست فعلی پیدا نشد | آزمون عدم افشای وجود حساب، ارسال ناموفق و مصرف مجدد |
| 4 | POST | `/api/auth/login` | عمومی؛ گذرواژه | بدون نشست؛ MFA اجباری برای OWNER/PLATFORM_ADMIN و عضویت OWNER/ADMIN؛ MFA فعال برای همه حساب‌ها باید challenge بدهد | نقش از DB و عضویت فعال استخراج می‌شود | Same-Origin، محدودیت IP/ایمیل، dummy password verification، ثبت Audit؛ آزمون ورود ممتاز، enrollment، TOTP replay و recovery موجود؛ آزمون جدید کاربر عادی MFAدار افزوده شد | اصلاح شاخه: حساب عادی با MFA فعال باید LOGIN_MFA challenge بگیرد؛ CI نهایی در انتظار |
| 5 | POST | `/api/auth/logout` | نشست اختیاری؛ خروج idempotent | Same-Origin؛ اگر نشست موجود باشد همان نشست حذف می‌شود | فقط نشست جاری | حذف نشست، پاک‌سازی Cookie و Audit؛ آزمون HTTP خروج و ابطال نشست موجود | پس از حذف رکورد، تاریخچه revoke نگهداری نمی‌شود؛ تصمیم نگهداری Audit |
| 6 | GET | `/api/auth/me` | کاربر احرازشده | نشست معتبر، منقضی‌نشده، لغونشده، غیرفعال‌نبودن کاربر و idle کمتر از ۳۰ دقیقه | خود کاربر | currentSession + no-store؛ آزمون نشست معتبر، نامعتبر و revoked موجود | پوشش وضعیت‌های race و disable همزمان تکمیل شود |
| 7 | POST | `/api/auth/mfa/disable` | کاربر صاحب نشست MFA | نشست فعال با MFA تازه حداکثر ۱۲ ساعت + TOTP یا recovery code معتبر | فقط MFA همان کاربر | Same-Origin، محدودیت تلاش، ابطال تمام نشست‌ها و recovery codes، Audit؛ آزمون disable و ابطال نشست در آزمون MFA موجود | سیاست ۱۲ ساعت برای عملیات حساس نیازمند بازبینی مالک |
| 8 | POST | `/api/auth/mfa/enroll/confirm` | دارنده challenge enrollment | Bearer challenge با purpose=MFA_ENROLLMENT، حداکثر ۱۰ دقیقه، TOTP معتبر؛ حداکثر ۵ تلاش | حساب صاحب challenge | Same-Origin، challenge یک‌بارمصرف، secret رمزگذاری‌شده، recovery codes فقط یک‌بار نمایش؛ آزمون enrollment کامل موجود | آزمون توکن challenge منقضی/مصرف‌شده و تلاش همزمان بیشتر شود |
| 9 | POST | `/api/auth/mfa/enroll` | دارنده challenge enrollment | Bearer challenge معتبر؛ بدون نشست عادی | حساب صاحب challenge | Same-Origin، محدودیت تلاش در رکورد challenge، secret رمزگذاری‌شده و pending expiry؛ آزمون enrollment کامل موجود | خروجی secret فقط روی TLS و بدون ثبت در log؛ بازبینی telemetry |
| 10 | POST | `/api/auth/mfa/recovery-codes` | کاربر صاحب نشست MFA | نشست فعال با MFA تازه حداکثر ۱۲ ساعت + عامل فعلی معتبر | فقط کاربر خودش | Same-Origin، محدودیت تلاش، چرخش اتمیک و حذف کدهای قبلی؛ آزمون چرخش و single-use موجود | سیاست ۱۲ ساعت و بازیابی حساب بازبینی شود |
| 11 | POST | `/api/auth/mfa/verify` | دارنده challenge ورود | Bearer challenge LOGIN_MFA حداکثر ۵ دقیقه + TOTP/recovery code؛ ۵ تلاش؛ جلوگیری از replay | حساب صاحب challenge | Same-Origin، challenge یک‌بارمصرف، نشست assurance=MFA؛ آزمون TOTP، replay و recovery single-use موجود | پس از challenge، وضعیت disable کاربر نیز در transaction نهایی دوباره بررسی شود |
| 12 | POST | `/api/auth/register` | عمومی؛ ثبت حساب عادی | بدون نشست؛ تأیید ایمیل قبل از ورود | نقش از ورودی کاربر پذیرفته نمی‌شود؛ نیازمند وجود Owner اولیه | Same-Origin، محدودیت IP/ایمیل، پاسخ یکنواخت برای ایمیل تکراری، Audit؛ آزمون Origin و بخشی از مسیر auth؛ ثبت‌نام موفق و تحویل ایمیل آزمون اختصاصی می‌خواهد | آزمون race ثبت‌نام، تحویل ایمیل و عدم پذیرش role تزریقی |
| 13 | POST | `/api/auth/resend-verification` | عمومی؛ ایمیل | بدون نشست؛ توکن EMAIL_VERIFY یک‌بارمصرف ۲۴ ساعت | فقط حساب واجد شرایط | Same-Origin، محدودیت IP/ایمیل، پاسخ عمومی 202؛ پوشش مستقیم HTTP کامل پیدا نشد | آزمون enumeration، rate limit و تحویل ناموفق |
| 14 | POST | `/api/auth/reset-password` | عمومی؛ Bearer reset token | بدون نشست؛ توکن PASSWORD_RESET یک‌بارمصرف ۳۰ دقیقه | فقط حساب مالک توکن | Same-Origin، محدودیت IP/token، مصرف اتمیک توکن، حذف همه نشست‌ها و Audit؛ آزمون lifecycle در سطح سرویس/DB موجود؛ آزمون HTTP کامل لازم است | آزمون endpoint HTTP، token race و session revocation |
| 15 | POST | `/api/auth/sessions/revoke-all` | کاربر صاحب نشست | نشست معتبر؛ MFA step-up جداگانه ندارد | فقط نشست‌های همان کاربر | Same-Origin، ابطال همه نشست‌ها، Audit و پاک‌سازی Cookie؛ آزمون session lifecycle موجود | تأیید رفتار در درخواست همزمان و نشست جاری |
| 16 | POST | `/api/auth/sessions/revoke` | کاربر صاحب نشست | نشست معتبر؛ MFA step-up جداگانه ندارد | شناسه نشست فقط اگر متعلق به همان کاربر باشد؛ غیرخودی 404 | Same-Origin، update شرطی مالکیت و Audit؛ آزمون ابطال نشست خودی و منع نشست کاربر دیگر موجود | آزمون شناسه‌های حدسی و race |
| 17 | GET | `/api/auth/sessions` | کاربر صاحب نشست | نشست معتبر؛ idle timeout و TTL؛ بدون MFA اضافی | فقط نشست‌های همان کاربر | فهرست محدود به ۵۰؟ در این endpoint تمام نشست‌های فعال کاربر؛ tokenHash برنمی‌گردد؛ idle cleanup؛ آزمون session listing، idle expiry و عدم افشای tokenHash موجود | صفحه‌بندی در صورت رشد تعداد نشست‌ها |
| 18 | POST | `/api/auth/verify-email` | عمومی؛ Bearer verification token | بدون نشست؛ توکن EMAIL_VERIFY یک‌بارمصرف ۲۴ ساعت | فقط حساب صاحب توکن | Same-Origin، مصرف اتمیک توکن، Audit؛ آزمون مستقیم HTTP کامل در فایل‌های بررسی‌شده پیدا نشد | افزودن محدودیت IP و آزمون مصرف همزمان/منقضی |
| 19 | POST | `/api/dana/generate` | کاربر تأییدشده در Tenant | نشست معتبر + ایمیل تأییدشده؛ OWNER/ADMIN MFA تازه؛ MANAGER/MEMBER بدون MFA اجباری | Tenant ID از body گرفته اما عضویت و action=ai_generate از DB و RLS بررسی می‌شود | Same-Origin، محدودیت ۱۲ درخواست/دقیقه/کاربر، نقش Runtime، revalidation در تراکنش، ثبت نتیجه؛ آزمون عمومی provider/unit و Tenant RLS؛ آزمون route E2E تولید/هزینه لازم است | billing NOT_CONNECTED؛ آزمون مالکیت prompt، quota و provider failure |
| 20 | POST | `/api/dana/prompt-studio` | هر کاربر دارای نشست | نشست فعال؛ ایمیل تأیید و MFA الزامی نیست | بدون Tenant context؛ خروجی stateless و persisted=false | Same-Origin و Zod؛ provider استفاده نمی‌شود؛ آزمون عدم دسترسی anonymous و cross-origin موجود | بدون rate limit؛ تصمیم بگیرید ابزار شخصی رایگان است یا قابلیت tenant/اشتراکی |
| 21 | GET | `/api/health` | عمومی؛ probe | بدون نشست | بدون Tenant | فقط liveness HTTP؛ ادعای سلامت DB ندارد؛ آزمون liveness موجود | مناسب probe عمومی |
| 22 | POST | `/api/negah/creative-brief` | هر کاربر دارای نشست | نشست فعال؛ ایمیل تأیید و MFA الزامی نیست | بدون Tenant context؛ stateless و persisted=false | Same-Origin و Zod؛ provider استفاده نمی‌شود؛ آزمون anonymous و cross-origin موجود | بدون rate limit؛ اگر قابلیت مشتری/اشتراکی است به Tenant و quota وصل شود |
| 23 | POST | `/api/negah/generate` | کاربر تأییدشده در Tenant | نشست معتبر + ایمیل تأییدشده؛ OWNER/ADMIN MFA تازه؛ MEMBER/MANAGER بدون MFA اجباری | Tenant ID از body؛ action=ai_generate و membership/RLS | Same-Origin، محدودیت ۳ درخواست/دقیقه/کاربر، role checks، revalidation، persistence رکورد تولید؛ آزمون provider/RLS؛ route E2E با provider و quota لازم است | فایل رسانه فقط Provider URL است؛ billing NOT_CONNECTED؛ ذخیره خصوصی asset هنوز نیست |
| 24 | POST | `/api/owner/bootstrap` | دارنده secret اولیه | بدون نشست؛ bootstrap secret با حداقل ۳۲ نویسه؛ ایمیل باید بعداً تأیید شود؛ MFA هنگام ورود بعدی الزامی | ایجاد فقط اولین Owner از تابع محدود DB | Same-Origin، مقایسه timing-safe، محدودیت ۵ بار/ساعت پس از secret معتبر، platform runtime role، یک‌بارمصرفی DB؛ آزمون bootstrap و منع دسترسی پیش از تأیید ایمیل موجود | بررسی secret rotation، جلوگیری از ثبت secret در logs و انقضای یک‌باره |
| 25 | PATCH | `/api/owner/email-contacts/[contactId]` | فقط platform OWNER | نشست OWNER معتبر + MFA تازه حداکثر ۱۲ ساعت | داده سراسری پلتفرم؛ contactId فقط در تراکنش Owner | Same-Origin، ۱۰ تغییر/ساعت، Serializable، Audit، محافظت از آخرین ایمیل Owner تأییدشده؛ آزمون CRUD، throttling و race آخرین contact موجود | بازبینی ۱۲ ساعت MFA برای تغییر مسیرهای بازیابی |
| 26 | DELETE | `/api/owner/email-contacts/[contactId]` | فقط platform OWNER | نشست OWNER معتبر + MFA تازه حداکثر ۱۲ ساعت | داده سراسری پلتفرم؛ حذف contact هدف | Same-Origin، ۱۰ حذف/ساعت، Serializable، Audit، حفظ آخرین ایمیل Owner تأییدشده؛ آزمون حذف و race آخرین contact موجود | حذف باید با retention/audit policy هماهنگ باشد |
| 27 | POST | `/api/owner/email-contacts/[contactId]/verify` | فقط platform OWNER | نشست OWNER معتبر + MFA تازه حداکثر ۱۲ ساعت | contact هدف در دامنه Owner | Same-Origin، محدودیت per-owner و per-contact، token hash با عمر ۳۰ دقیقه، ارسال ایمیل؛ آزمون rate limit و cleanup در صورت ارسال ناموفق موجود | تست ارسال واقعی provider و جلوگیری از لینک در log |
| 28 | POST | `/api/owner/email-contacts/confirm` | عمومی؛ Bearer verification token | بدون نشست؛ توکن تصادفی ۲۵۶ بیتی، ۳۰ دقیقه، یک‌بارمصرف | فقط contact متناظر با token؛ transaction با capability hash | Same-Origin، platform transaction با context محدود، consume اتمیک، Audit؛ آزمون end-to-end confirmation مستقل در تست فعلی پیدا نشد | بدون IP throttle؛ افزودن throttling و آزمون replay/expired |
| 29 | GET | `/api/owner/email-contacts` | فقط platform OWNER | نشست OWNER معتبر + MFA تازه حداکثر ۱۲ ساعت | فهرست سراسری EmailContact | withPlatformOwnerTransaction؛ no-store؛ آزمون فهرست Owner موجود | آزمون عدم افشای فیلدهای حساس اضافی |
| 30 | POST | `/api/owner/email-contacts` | فقط platform OWNER | نشست OWNER معتبر + MFA تازه حداکثر ۱۲ ساعت | ایجاد contact در دامنه پلتفرم | Same-Origin، ۱۰ ایجاد/ساعت، اعتبارسنجی، Audit، verification required؛ آزمون create و throttling موجود | تأیید ارسال ایمیل در محیط واقعی هنوز اثبات نشده |
| 31 | GET | `/api/owner/future-lab` | فقط platform OWNER | نشست OWNER معتبر + MFA تازه حداکثر ۱۲ ساعت | پیشنهادهای توسعه سراسری | withPlatformOwnerTransaction؛ audit read؛ تست اختصاصی endpoint پیدا نشد | ثبت فقط در AuditEvent؛ آزمون دسترسی و pagination |
| 32 | POST | `/api/owner/future-lab` | فقط platform OWNER | نشست OWNER معتبر + MFA تازه حداکثر ۱۲ ساعت | ثبت پیشنهاد؛ بدون دسترسی Production | Same-Origin، ۴۰ درخواست/ساعت، Audit، productionAccess=false؛ تست اختصاصی endpoint پیدا نشد | آزمون owner-only، payload و rate limit |
| 33 | PATCH | `/api/owner/future-lab` | فقط platform OWNER | نشست OWNER معتبر + MFA تازه حداکثر ۱۲ ساعت | تصمیم روی پیشنهاد سراسری | Same-Origin، ۴۰ درخواست/ساعت، فقط یک تصمیم، executionAuthorized=false؛ تست اختصاصی endpoint پیدا نشد | تأیید تصمیم هرگز مجوز اجرا نمی‌دهد؛ این جداسازی حفظ شود |
| 34 | GET | `/api/owner/licenses` | فقط platform OWNER | نشست OWNER معتبر + MFA تازه حداکثر ۱۲ ساعت | تمام Tenantها و Licenseها در سطح پلتفرم | withPlatformOwnerTransaction؛ سقف فهرست ۵۰۰؛ تست اختصاصی endpoint پیدا نشد | آزمون فهرست، pagination و عدم افشای داده غیرضروری |
| 35 | POST | `/api/owner/licenses` | فقط platform OWNER | نشست OWNER معتبر + MFA تازه حداکثر ۱۲ ساعت | صدور License برای Tenant و Product انتخاب‌شده توسط Owner | Same-Origin، ۳۰ ایجاد/ساعت، کنترل وضعیت Tenant/Product، تاریخ‌ها و Audit؛ تست اختصاصی endpoint پیدا نشد | آزمون duplicate، صدور مجدد، race و اثر entitlement |
| 36 | PATCH | `/api/owner/licenses` | فقط platform OWNER | نشست OWNER معتبر + MFA تازه حداکثر ۱۲ ساعت | فعال/غیرفعال کردن License سراسری | Same-Origin، ۶۰ تغییر/ساعت، کنترل تاریخ و Audit؛ تست اختصاصی endpoint پیدا نشد | آزمون revoke/restore و اثر cache/entitlement |
| 37 | GET | `/api/owner/products` | فقط platform OWNER | نشست OWNER معتبر + MFA تازه حداکثر ۱۲ ساعت | کاتالوگ سراسری ۱۱ محصول؛ DANA نباید محصول مستقل باشد | withPlatformOwnerTransaction؛ آمار سراسری؛ آزمون Owner portfolio و حفظ ۱۱ محصول موجود | آزمون status/baseUrl و DANA در capabilities API نیز لازم است |
| 38 | POST | `/api/owner/products` | فقط platform OWNER | نشست OWNER معتبر + MFA تازه حداکثر ۱۲ ساعت | راه‌اندازی کاتالوگ سراسری | Same-Origin، ۲۰ بار/ساعت، createMany skipDuplicates، Audit؛ آزمون initialize idempotent و دقیقاً ۱۱ محصول موجود | تست‌های race و وضعیت planned حفظ شود |
| 39 | PATCH | `/api/owner/products` | فقط platform OWNER | نشست OWNER معتبر + MFA تازه حداکثر ۱۲ ساعت | پیکربندی سراسری Product | Same-Origin، ۲۰ بار/ساعت، اعتبارسنجی HTTPS و status، Audit؛ آزمون Origin و rate limit موجود | آزمون هر transition وضعیت و URL |
| 40 | GET | `/api/ready` | عمومی؛ probe | بدون نشست؛ endpoint نقش‌های DB را بررسی می‌کند | بدون Tenant؛ فقط وضعیت readiness | اتصال DB و assert نقش‌های auth/platform/tenant؛ جزئیات پاسخ محدود؛ آزمون readiness در HTTP integration موجود | عمومی است و DB را در هر درخواست probe می‌کند؛ محدودسازی شبکه/توکن probe بررسی شود |
| 41 | GET | `/api/tenants/[tenantId]/access` | عضو Tenant | نشست معتبر + ایمیل تأییدشده؛ OWNER/ADMIN MFA تازه؛ سایر نقش‌ها نشست معتبر | tenant_read؛ عضویت فعال در همان Tenant | withTenantRequestTransaction و RLS؛ Tenant ID مسیر با membership تطبیق می‌شود؛ آزمون own/cross-tenant موجود | آزمون VIEWER و tenant suspended در endpoint HTTP |
| 42 | GET | `/api/tenants/[tenantId]/ai-generations` | عضو Tenant با مجوز ai_read | نشست معتبر + ایمیل تأییدشده؛ OWNER/ADMIN MFA تازه | OWNER/ADMIN/MANAGER/MEMBER؛ VIEWER رد؛ فقط Tenant مسیر | RLS transaction؛ فیلتر tenantId؛ حداکثر ۵۰ مورد؛ تست مستقیم route در مجموعه بررسی‌شده پیدا نشد | آزمون عدم افشای prompt/output بین Tenantها و pagination |
| 43 | GET | `/api/tenants/[tenantId]/members` | مدیر/مالک Tenant | نشست معتبر + ایمیل تأییدشده + MFA تازه | فقط OWNER/ADMIN؛ members_manage | RLS transaction و listTenantMembers؛ فقط همان Tenant؛ آزمون OWNER/ADMIN در برابر MEMBER و عدم افشای credential موجود | آزمون platform role مستقل از membership و pagination |
| 44 | GET | `/api/tenants/[tenantId]/products` | عضو Tenant | نشست معتبر + ایمیل تأییدشده؛ OWNER/ADMIN MFA تازه | tenant_read؛ همه نقش‌های عضویت فعال از جمله VIEWER | RLS transaction؛ License فقط Tenant هدف؛ دسترسی محصول از License/status؛ تست مستقیم route در مجموعه بررسی‌شده پیدا نشد | آزمون انقضا، revoke، product inactive و cross-tenant |
| 45 | GET | `/api/tenants/[tenantId]` | عضو Tenant | نشست معتبر + ایمیل تأییدشده؛ OWNER/ADMIN MFA تازه | tenant_read؛ عضویت همان Tenant | getTenantWorkspace با auth DB و tenant DB؛ آزمون workspace خودی و cross-tenant موجود | آزمون تمام نقش‌ها و Tenant suspended |
| 46 | PATCH | `/api/tenants/[tenantId]` | OWNER یا ADMIN همان Tenant | نشست معتبر + ایمیل تأییدشده + MFA تازه | tenant_manage؛ فقط OWNER/ADMIN | Same-Origin، ۱۰ تغییر/ساعت، بررسی اولیه و تراکنش revalidation، Audit؛ آزمون ADMIN rename و cross-origin موجود | آزمون مالکیت همزمان، race و MFA منقضی |
| 47 | DELETE | `/api/tenants/[tenantId]` | فقط OWNER همان Tenant | نشست معتبر + ایمیل تأییدشده + MFA تازه | tenant_delete؛ ADMIN و دیگر نقش‌ها رد | Same-Origin، ۳ بار/ساعت، close نرم به‌جای hard delete، Audit؛ آزمون ADMIN denied و OWNER close موجود | آزمون جلوگیری از حذف دائمی داده و اثر license/billing |
| 48 | GET | `/api/tenants` | کاربر ثبت‌نام‌شده | نشست معتبر + ایمیل تأییدشده؛ MFA اجباری نیست | فقط Tenantهایی که کاربر عضو فعال آن‌هاست؛ user-scoped context بدون tenantId | withAuthenticatedUserTransaction؛ tenantId دلخواه رد می‌شود؛ آزمون فهرست خودی و unverified denial موجود | آزمون کاربر چند Tenant و membership غیرفعال |
| 49 | POST | `/api/tenants` | کاربر ثبت‌نام‌شده | نشست معتبر + ایمیل تأییدشده؛ MFA اجباری نیست | Tenant ID/role از کلاینت پذیرفته نمی‌شود؛ مالک اولیه از user نشست تعیین می‌شود | Same-Origin، ۵ ایجاد/ساعت، UUID/slug سروری، helper محدود createTenantForAuthenticatedUser؛ آزمون ایجاد Tenant، رد role تزریقی و audit موجود | آزمون concurrent duplicate و abuse limit |

## 3. مدل مجوزهای Tenant در کد

مبنای مجوزها در `src/lib/authorization.mjs` است و نقش از عضویت خوانده‌شده از دیتابیس می‌آید، نه از payload کاربر:

| Action | OWNER | ADMIN | MANAGER | MEMBER | VIEWER |
|---|---:|---:|---:|---:|---:|
| tenant_read | مجاز | مجاز | مجاز | مجاز | مجاز |
| tenant_manage | مجاز | مجاز | رد | رد | رد |
| members_manage | مجاز | مجاز | رد | رد | رد |
| billing_manage | مجاز | رد | رد | رد | رد |
| tenant_delete | مجاز | رد | رد | رد | رد |
| ai_generate | مجاز | مجاز | مجاز | مجاز | رد |
| ai_read | مجاز | مجاز | مجاز | مجاز | رد |

قواعد مکمل:
- Tenant باید ACTIVE باشد و `membership.userId` و `membership.tenantId` دقیقاً با نشست و مسیر درخواست تطبیق داشته باشند.
- ایمیل کاربر برای عملیات Tenant باید تأیید شده باشد.
- OWNER و ADMIN عضویت Tenant برای عملیات Tenant به نشست MFA با تازگی حداکثر ۱۲ ساعت نیاز دارند.
- نقش‌های پلتفرم OWNER و PLATFORM_ADMIN در ورود به MFA هدایت می‌شوند؛ عملیات کنترل‌پنل Owner فقط برای `platformRole=OWNER` است.
- هر عملیات Tenant از `withTenantRequestTransaction` استفاده می‌کند تا نشست، کاربر، عضویت و Tenant در تراکنش RLS مجدداً بررسی شوند.
- `tenantId` انتخاب‌شده از سمت کاربر به‌تنهایی مجوز محسوب نمی‌شود.

## 4. کنترل‌های احراز هویت و نشست
- Cookie نشست: `vayro_session`، HttpOnly، SameSite=Lax، Secure در Production.
- طول عمر مطلق نشست: ۷ روز؛ idle timeout: ۳۰ دقیقه؛ به‌روزرسانی فعالیت حداکثر هر ۵ دقیقه.
- نشست دارای `assurance=PASSWORD|MFA` و زمان `mfaAuthenticatedAt` است.
- نشست revoked، منقضی، متعلق به کاربر disabled یا idle رد می‌شود.
- تغییر رمز، نشست‌های فعال کاربر را باطل می‌کند.
- تغییر MFA، نشست‌های کاربر را باطل می‌کند.
- MFA از TOTP، رمزنگاری AES-256-GCM برای secret، recovery codeهای hash‌شده، مصرف یک‌باره و جلوگیری از TOTP replay پشتیبانی می‌کند.
- challenge ورود MFA پنج دقیقه و challenge enrollment ده دقیقه اعتبار دارد و حداکثر پنج تلاش می‌پذیرد.
- عملیات Owner در `withPlatformOwnerTransaction` علاوه بر بررسی اولیه، OWNER و نشست MFA را در تراکنش Platform دوباره اعتبارسنجی می‌کند.

## 5. یافته‌های ممیزی و اولویت اصلاح

### API-AUTH-001 — High: عبور از MFA برای حساب عادی دارای MFA فعال
**وضعیت: FIX APPLIED IN ENGINEERING BRANCH; CI VALIDATION PENDING**

در `/api/auth/login` شرط challenge فقط `isPrivilegedRole(...)` بود. آزمون HTTP جدید روی commit `ac5a239` این نقص را به‌صورت قطعی بازتولید کرد: برای حساب عادی دارای MFA، پاسخ `200` و session PASSWORD صادر شد، درحالی‌که انتظار `202` و MFA challenge بود.

**اصلاح انجام‌شده:** شرط ورود به challenge اکنون `privileged || mfa?.enabledAt` است. purpose برای حساب MFAدار `LOGIN_MFA` و برای حساب ممتاز بدون عامل فعال `MFA_ENROLLMENT` باقی می‌ماند. آزمون جدید همچنین نبود Cookie و نبود session را بررسی می‌کند؛ آزمون موجود حساب عادی بدون MFA همچنان مسیر PASSWORD را می‌سنجد. CI پس از اصلاح روی commit `cefae36` در حال اجراست؛ تا تکمیل آن، این اصلاح `TESTED` اعلام نمی‌شود.

### API-ARCH-002 — Medium: DANA در API کاتالوگ به‌عنوان Product معرفی می‌شد
در نسخه بررسی‌شده مقدار DANA در مجموعه `PRODUCTS` بود، درحالی‌که قرارداد محصولی پروژه DANA را موتور داخلی می‌داند. این مورد اصلاح شد: DANA از مجموعه محصولات مستقل حذف شده و در صورت نیاز فقط در فهرست موتورهای داخلی باقی می‌ماند. آزمون API اکنون صریحاً بررسی می‌کند که `body.products` شامل DANA نباشد. نتیجه CI این تغییر هنوز در انتظار است.

### API-AUTH-003 — Medium: تازگی MFA برای عملیات ممتاز ۱۲ ساعت است
`authorizeOwnerSession` و `withPlatformOwnerTransaction` نشست MFA تا ۱۲ ساعت را برای تمام عملیات Owner می‌پذیرند. این یک سیاست پیاده‌سازی‌شده است، نه خطای احراز هویت؛ اما برای تغییرات پراثر مانند صدور/لغو License، تغییر مقصد ایمیل مالک و تغییر وضعیت محصول، پیشنهاد می‌شود Step-up کوتاه‌تر (مثلاً ۱۵ دقیقه) یا تأیید مجدد رمز/عامل MFA تعریف شود.

**اقدام:** تصمیم سیاستی مالک؛ تا آن زمان مقدار فعلی مستند و آزموده شود و هیچ کاهش امنیتی اعمال نشود.

### API-SCOPE-004 — Medium: ابزارهای تولید Brief فاقد Tenant و quota هستند
`/api/dana/prompt-studio` و `/api/negah/creative-brief` فقط نشست و Same-Origin می‌خواهند، provider ندارند و چیزی ذخیره نمی‌کنند؛ پس در وضعیت فعلی ابزار stateless هستند. اگر قرار است قابلیت پولی/مشتری باشند، باید ایمیل تأییدشده، Tenant membership، entitlement و rate limit داشته باشند. اگر ابزار شخصی رایگان‌اند، همین دامنه باید در قرارداد محصولی ثبت شود و rate limit سراسری اضافه گردد.

### API-OPS-005 — Low/Medium: Readiness عمومی و وابسته به دیتابیس است
`/api/ready` عمومی است و در هر درخواست چهار اتصال/نقش را probe می‌کند. پاسخ خطا جزئیات اتصال را افشا نمی‌کند، اما endpoint عمومی می‌تواند بار دیتابیس ایجاد کند و وضعیت سرویس را آشکار سازد.

**اقدام:** probe شبکه داخلی/توکن‌دار یا محدودیت نرخ در لایه edge؛ لiveness عمومی `/api/health` جدا باقی بماند.

### API-TEST-006 — High: پوشش آزمون endpointها هنوز کامل نیست
تست‌های موجود شامل auth/session lifecycle، MFA login، owner bootstrap، owner email contacts، owner products، Tenant create/list/rename/close، cross-tenant isolation، member directory، tenant RLS و readiness هستند. با این حال برای بعضی عملیات آزمون HTTP مستقل و مثبت/منفی کافی در مجموعه بررسی‌شده پیدا نشد؛ از جمله:
- forgot/reset/resend/verify email؛
- صدور و لغو License؛
- Future Lab read/create/decision؛
- Tenant product listing و AI generation/history؛
- Owner email-contact confirmation؛
- routeهای تولید DANA/NEGAH و خطاهای provider؛
- آزمون MFA step-up منقضی برای عملیات حساس.

**اقدام:** افزودن آزمون‌های HTTP production-build برای هر عملیات، با کاربر anonymous، نقش اشتباه، Tenant اشتباه، نشست منقضی/revoked، MFA قدیمی، Origin نامعتبر، object ID متعلق به دیگران و درخواست همزمان.

### API-TOKEN-007 — Medium: endpointهای تأیید ایمیل rate limit مستقل ندارند
`/api/auth/verify-email` و `/api/owner/email-contacts/confirm` بر توکن‌های تصادفی با entropy بالا، انقضا و مصرف یک‌باره تکیه دارند، اما throttling per-IP صریح در route دیده نشد.

**اقدام:** rate limit IP/endpoint در لایه مورد اعتماد؛ بدون اعتماد به X-Forwarded-For خام. آزمون replay و race.

## 6. شواهد آزمون موجود
- `tests/auth-endpoints.integration.mjs`: HTTP auth، login ممتاز و MFA enrollment/TOTP/replay/recovery، owner bootstrap، tenant lifecycle، member endpoint، capability catalogue، prompt-studio/creative-brief، password-change denial.
- `tests/session-lifecycle.integration.mjs`: فهرست نشست‌ها، revoke یک نشست، revoke-all، idle expiry و عدم دسترسی به نشست کاربر دیگر.
- `tests/owner-email-endpoints.integration.mjs`: Owner authorization، Same-Origin، Audit، throttling، تماس تأییدشده آخر و race همزمان.
- `tests/owner-products.integration.mjs`: سبد دقیق ۱۱ محصول، DANA خارج از portfolio، idempotent initialize و rate limit.
- `tests/tenant-request-authorization.integration.mjs`: session، tenant، role، expiry، disabled user و suspended tenant.
- `tests/tenant-rls.integration.mjs`: runtime RLS role واقعی در CI، cross-tenant denial، forged context، user-scoped listing و tenant provisioning.
- `tests/tenant-request-authorization.test.mjs`, `tests/authorization.test.mjs`, `tests/mfa-core.test.mjs`: قواعد مجوز، نقش و primitiveهای MFA.

موفقیت این تست‌ها فقط در محیط ایزوله CI معتبر است؛ هیچ‌کدام وجود policy در دیتابیس Production را ثابت نمی‌کند.

## 7. برنامه تکمیل آزمون و پذیرش
1. بستن API-AUTH-001 و API-ARCH-002 و اجرای CI/CodeQL روی commit جدید.
2. ساخت تست ماتریسی برای هر یک از ۴۹ عملیات: anonymous، valid role، invalid role، wrong tenant، expired/revoked session، stale MFA، invalid origin و rate limit.
3. ساخت تست‌های مثبت و منفی برای routeهای تجاری License، Product، Future Lab و generation.
4. اجرای endpoint contract tests در PostgreSQL ایزوله با نقش‌های auth/platform/tenant مجزا.
5. اجرای همان مجموعه علیه clone بازیابی‌شده از backup، نه Production.
6. پس از Backup/Restore مستقل، schema reconciliation و RLS policy review، ارائه گزارش مستقل تطبیق Production؛ تا آن زمان Production همچنان BLOCKED است.

## 8. تصمیم امنیتی
- **کد API:** ممیزی ایستا انجام شد؛ نقص MFA و مغایرت DANA شناسایی شدند؛ هر دو در شاخه مهندسی اصلاح شده‌اند و نتیجه CI نسخه اصلاحی هنوز در انتظار است.
- **آزمون‌ها:** پوشش قابل توجه وجود دارد اما تمام ۴۹ عملیات هنوز آزمون پذیرش مستقل ندارند.
- **دیتابیس Production:** BLOCKED؛ ۱۱ جدول RLS-enabled، صفر policy، migration ledger خالی و runtime roles اختصاصی مشاهده‌نشده در ممیزی زنده قبلی.
- **تغییر Production:** هیچ‌کدام انجام نشده و مجاز نیست.
- **انتشار عمومی/تجاری:** BLOCKED تا بسته‌شدن Gateهای دیتابیس، backup/restore، authorization و UAT.

**نتیجه:** ماتریس دسترسی پیشنهادی/موجود در این سند مرجع ممیزی است؛ پس از رفع نقص‌ها باید به policy tests و migration-backed database policies متصل شود. صرف وجود این سند، مجوز دسترسی یا انتشار ایجاد نمی‌کند.
