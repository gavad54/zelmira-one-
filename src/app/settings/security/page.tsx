"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type SecurityStatus = {
  enabled: boolean;
  required: boolean;
  unusedRecoveryCodes: number;
  replacementPending: boolean;
  replacementExpiresAt: string | null;
};

export default function SecuritySettingsPage() {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [replacementSecret, setReplacementSecret] = useState("");
  const [replacementUri, setReplacementUri] = useState("");
  const [replacementOldCode, setReplacementOldCode] = useState("");
  const [replacementNewCode, setReplacementNewCode] = useState("");

  async function loadStatus() {
    setError("");
    const response = await fetch("/api/auth/mfa/manage", { cache: "no-store" });
    if (response.status === 401) { window.location.assign("/login"); return; }
    const data = await response.json();
    if (!response.ok) throw new Error("وضعیت امنیت حساب دریافت نشد.");
    setStatus(data as SecurityStatus);
  }

  useEffect(() => {
    void loadStatus().catch(e => setError(e instanceof Error ? e.message : "خطای دریافت اطلاعات."));
  }, []);

  async function submit(action: "regenerate_recovery_codes" | "disable", event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/mfa/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, code, ...(action === "disable" ? { password } : {}) })
      });
      const data = await response.json();
      if (!response.ok) {
        const messages: Record<string, string> = {
          invalid_mfa_code: "کد تأیید نامعتبر است یا قبلاً استفاده شده است.",
          mfa_code_already_used: "این کد قبلاً استفاده شده است؛ کد تازه بگیرید.",
          mfa_required_for_privileged_account: "برای حساب مالک و مدیران ممتاز، MFA اجباری است و قابل غیرفعال‌سازی نیست.",
          invalid_credentials: "رمز عبور صحیح نیست.",
          try_again_later: "تعداد تلاش‌ها بیش از حد مجاز است؛ بعداً دوباره امتحان کنید."
        };
        throw new Error(messages[data.error] ?? "عملیات امنیتی انجام نشد.");
      }
      setCode("");
      if (action === "regenerate_recovery_codes") {
        setRecoveryCodes(data.recoveryCodes ?? []);
        setNotice("کدهای قبلی باطل شدند. کدهای جدید را همین حالا در محل امن ذخیره کنید.");
        await loadStatus();
      } else {
        window.location.assign("/login");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای انجام عملیات.");
    } finally {
      setBusy(false);
    }
  }

  async function replaceFactor(action: "begin" | "confirm", event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const code = action === "begin" ? replacementOldCode : replacementNewCode;
      const response = await fetch("/api/auth/mfa/replace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, code })
      });
      const data = await response.json();
      if (!response.ok) {
        const messages: Record<string, string> = {
          invalid_mfa_code: "کد عامل فعلی معتبر نیست یا قبلاً استفاده شده است.",
          invalid_new_factor_code: "کد عامل جدید معتبر نیست.",
          no_pending_factor: "ابتدا فرایند تعویض را آغاز کنید.",
          pending_factor_expired: "مهلت تأیید تمام شده است؛ فرایند را دوباره آغاز کنید.",
          mfa_code_already_used: "این کد قبلاً استفاده شده است؛ کد تازه بگیرید.",
          try_again_later: "تعداد تلاش‌ها بیش از حد مجاز است؛ بعداً دوباره امتحان کنید."
        };
        throw new Error(messages[data.error] ?? "تعویض عامل احراز هویت انجام نشد.");
      }
      if (action === "begin") {
        setReplacementSecret(data.secret);
        setReplacementUri(data.otpauthUri);
        setReplacementOldCode("");
        setReplacementNewCode("");
        setNotice("عامل جدید به‌صورت موقت ثبت شد. آن را در برنامه احراز هویت اضافه و پیش از پایان مهلت تأیید کنید. عامل قبلی هنوز فعال است.");
        await loadStatus();
      } else {
        setRecoveryCodes(data.recoveryCodes ?? []);
        setReplacementSecret("");
        setReplacementUri("");
        setReplacementOldCode("");
        setReplacementNewCode("");
        setNotice("عامل جدید تأیید و جایگزین شد. کدهای بازیابی قبلی باطل شده‌اند؛ کدهای تازه را در محل امن ذخیره کنید.");
        await loadStatus();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای انجام عملیات.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-panel">
        <Link href="/dashboard">بازگشت به داشبورد</Link>
        <span>VAYRO SECURITY</span>
        <h1>تنظیمات امنیت حساب</h1>
        {!status ? <p>در حال دریافت وضعیت امنیتی…</p> : <>
          <p>وضعیت تأیید دومرحله‌ای: <strong>{status.enabled ? "فعال" : "غیرفعال"}</strong></p>
          <p>الزام امنیتی حساب: <strong>{status.required ? "اجباری" : "اختیاری"}</strong></p>
          <p>کدهای بازیابی استفاده‌نشده: <strong>{status.unusedRecoveryCodes}</strong></p>
          {status.enabled && <form onSubmit={event => void replaceFactor("begin", event)}>
            <h2>تعویض امن دستگاه احراز هویت</h2>
            <p>ابتدا با کد دستگاه فعلی اجازه تعویض می‌دهید. عامل فعلی تا تأیید کد دستگاه جدید فعال می‌ماند.</p>
            <label>کد دستگاه فعلی
              <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={replacementOldCode} onChange={event => setReplacementOldCode(event.target.value)} />
            </label>
            <button disabled={busy}>{busy ? "در حال انجام…" : "آغاز تعویض دستگاه"}</button>
          </form>}
          {replacementSecret && <section aria-live="polite">
            <h2>ثبت موقت دستگاه جدید</h2>
            <p>در برنامه احراز هویت، کلید زیر را به‌صورت دستی وارد کنید. این کلید فقط در همین مرحله نمایش داده می‌شود.</p>
            <p><code>{replacementSecret}</code></p>
            <p>پیوند ثبت: <code>{replacementUri}</code></p>
            <p>مهلت تأیید: ۱۰ دقیقه. تا تأیید موفق، دستگاه قبلی همچنان معتبر است.</p>
            <form onSubmit={event => void replaceFactor("confirm", event)}>
              <label>کد شش‌رقمی دستگاه جدید
                <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={replacementNewCode} onChange={event => setReplacementNewCode(event.target.value)} />
              </label>
              <button disabled={busy}>{busy ? "در حال تأیید…" : "تأیید و جایگزینی عامل"}</button>
            </form>
          </section>}
          {status.replacementPending && !replacementSecret && <p role="status">یک فرایند تعویض در انتظار تأیید است. اگر کلید موقت را در اختیار ندارید، با کد دستگاه فعلی فرایند تازه‌ای آغاز کنید.</p>}
          {status.enabled && <>
            <form onSubmit={event => void submit("regenerate_recovery_codes", event)}>
              <h2>صدور مجدد کدهای بازیابی</h2>
              <p>برای این عملیات، کد تازه برنامه احراز هویت لازم است. کدهای قبلی پس از موفقیت باطل می‌شوند.</p>
              <label>کد شش‌رقمی برنامه احراز هویت
                <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(event.target.value)} />
              </label>
              <button disabled={busy}>{busy ? "در حال انجام…" : "صدور ۱۰ کد جدید"}</button>
            </form>
            {recoveryCodes.length > 0 && <section aria-live="polite">
              <h2>کدهای جدید بازیابی</h2>
              <p>این فهرست فقط در همین نمایش در دسترس است. آن را در محل امن ذخیره کنید.</p>
              <ol>{recoveryCodes.map(value => <li key={value}><code>{value}</code></li>)}</ol>
            </section>}
            {!status.required && <form onSubmit={event => void submit("disable", event)}>
              <h2>غیرفعال‌سازی MFA</h2>
              <p>غیرفعال‌سازی همه نشست‌ها را باطل می‌کند و پس از آن باید دوباره وارد شوید.</p>
              <label>رمز عبور فعلی<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
              <label>کد شش‌رقمی برنامه احراز هویت<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(event.target.value)} /></label>
              <button disabled={busy}>{busy ? "در حال انجام…" : "غیرفعال‌سازی و خروج از حساب"}</button>
            </form>}
          </>}
          {!status.enabled && <p>برای فعال‌سازی MFA، از فرایند ورود امن استفاده کنید. این صفحه عامل جدید را بدون تأیید ثبت نمی‌کند.</p>}
        </>}
        {notice && <p role="status">{notice}</p>}
        {error && <p role="alert">{error}</p>}
      </section>
    </main>
  );
}
