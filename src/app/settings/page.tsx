import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-panel">
        <span>VAYRO</span>
        <h1>تنظیمات حساب</h1>
        <p>مدیریت تنظیمات امنیتی و تأیید دومرحله‌ای حساب.</p>
        <Link href="/settings/security">رفتن به تنظیمات امنیتی</Link>
        <p><Link href="/dashboard">بازگشت به داشبورد</Link></p>
      </section>
    </main>
  );
}
