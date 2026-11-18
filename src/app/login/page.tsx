"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";

type LoginResponse = {
  authenticated?: boolean;
  user?: { platformRole?: string };
  mfaRequired?: boolean;
  mfaSetupRequired?: boolean;
  challengeToken?: string;
  error?: string;
  recoveryCodes?: string[];
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [setupSecret, setSetupSecret] = useState("");
  const [stage, setStage] = useState<"login" | "verify" | "enroll" | "recovery">("login");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [destination, setDestination] = useState("/dashboard");

  async function submitLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json() as LoginResponse;
      if (!response.ok) {
        throw new Error(data.error === "try_again_later"
          ? "تعداد تلاش‌ها زیاد است؛ بعداً دوباره امتحان کنید."
          : "ورود انجام نشد. ایمیل و رمز را بررسی کنید؛ اگر حساب تازه ساخته‌اید، ایمیل را تأیید کنید.");
      }
      if (data.mfaRequired && data.challengeToken) {
        setChallengeToken(data.challengeToken);
        if (data.mfaSetupRequired) {
          const enrollment = await fetch("/api/auth/mfa/enroll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ challengeToken: data.challengeToken })
          });
          const enrollmentData = await enrollment.json();
          if (!enrollment.ok) throw new Error("راه‌اندازی MFA انجام نشد. تنظیم کلید رمزنگاری سرور یا اعتبار چالش را بررسی کنید.");
          setSetupSecret(enrollmentData.secret);
          setStage("enroll");
        } else {
          setStage("verify");
        }
        return;
      }
      location.assign(data.user?.platformRole === "OWNER" ? "/dashboard" : "/workspaces");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ورود انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function submitMfa(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken, code })
      });
      const data = await response.json() as LoginResponse;
      if (!response.ok) {
        throw new Error(data.error === "try_again_later"
          ? "تعداد تلاش‌ها زیاد است؛ بعداً دوباره امتحان کنید."
          : data.error === "mfa_configuration_error"
            ? "کلید رمزنگاری MFA در سرور تنظیم نشده یا معتبر نیست."
            : "کد نامعتبر، تکراری یا منقضی شده است. کد تازه را وارد کنید.");
      }
      if (data.recoveryCodes?.length) {
        setRecoveryCodes(data.recoveryCodes);
        setDestination(data.user?.platformRole === "OWNER" ? "/dashboard" : "/workspaces");
        setStage("recovery");
        return;
      }
      location.assign(data.user?.platformRole === "OWNER" ? "/dashboard" : "/workspaces");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تأیید دومرحله‌ای انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  if (stage === "recovery") {
    return <main className="auth-page" dir="rtl"><section className="auth-panel">
      <span>VAYRO</span><h1>کدهای بازیابی</h1>
      <p>این کدها فقط همین بار نمایش داده می‌شوند. آن‌ها را در محل امن و جدا از دستگاه ورود نگهداری کنید.</p>
      <ul>{recoveryCodes.map(value => <li key={value}><code>{value}</code></li>)}</ul>
      <button onClick={() => location.assign(destination)}>ادامه</button>
    </section></main>;
  }

  if (stage === "verify" || stage === "enroll") {
    return <main className="auth-page" dir="rtl"><section className="auth-panel">
      <span>VAYRO</span>
      <h1>{stage === "enroll" ? "فعال‌سازی تأیید دومرحله‌ای" : "تأیید ورود"}</h1>
      {stage === "enroll" && <>
        <p>این کلید را در برنامه احراز هویت خود ثبت کنید. آن را با دیگران به اشتراک نگذارید.</p>
        <code>{setupSecret}</code>
        <p>پس از افزودن حساب VAYRO، کد شش‌رقمی برنامه را وارد کنید.</p>
      </>}
      <form onSubmit={submitMfa}>
        <label>کد شش‌رقمی یا کد بازیابی<input inputMode="text" autoComplete="one-time-code" required value={code} onChange={event => setCode(event.target.value)} /></label>
        <button disabled={busy}>{busy ? "در حال بررسی..." : "تأیید و ورود"}</button>
      </form>
      <p role="alert">{message}</p>
    </section></main>;
  }

  return <main className="auth-page" dir="rtl"><section className="auth-panel">
    <span>VAYRO</span><h1>ورود به حساب</h1>
    <form onSubmit={submitLogin}>
      <label>ایمیل<input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label>رمز عبور<input type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
      <button disabled={busy}>{busy ? "در حال ورود..." : "ورود"}</button>
    </form>
    <p role="alert">{message}</p>
    <Link href="/register">ساخت حساب</Link> · <Link href="/resend-verification">ارسال دوباره تأیید</Link> · <Link href="/forgot-password">فراموشی رمز</Link>
  </section></main>;
}
