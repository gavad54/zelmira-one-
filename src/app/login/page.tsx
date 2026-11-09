"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";

type Stage = "login" | "enroll" | "verify" | "recovery";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(path: string, body: Record<string, string>) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = data.error;
      if (error === "try_again_later") throw new Error("تعداد تلاش‌ها زیاد است؛ بعداً دوباره امتحان کنید.");
      if (error === "mfa_temporarily_unavailable") throw new Error("سرویس احراز هویت دومرحله‌ای موقتاً در دسترس نیست.");
      if (error === "invalid_or_expired_challenge") throw new Error("مهلت کد امنیتی تمام شده یا کد معتبر نیست. دوباره وارد شوید.");
      throw new Error("درخواست انجام نشد. اطلاعات را بررسی و دوباره تلاش کنید.");
    }
    return data;
  }

  async function submitLogin(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const data = await post("/api/auth/login", { email, password });
      if (data.mfaRequired && data.challengeToken) {
        setChallengeToken(data.challengeToken);
        if (data.enrollmentRequired) {
          const setup = await post("/api/auth/mfa/enroll", { challengeToken: data.challengeToken });
          setSecret(setup.secret);
          setOtpauthUrl(setup.otpauthUrl);
          setStage("enroll");
        } else {
          setStage("verify");
        }
        return;
      }
      if (data.authenticated) {
        location.assign("/workspaces");
        return;
      }
      throw new Error("ورود کامل نشد. دوباره تلاش کنید.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ورود انجام نشد.");
    } finally { setBusy(false); }
  }

  async function submitFactor(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      if (stage === "enroll") {
        const data = await post("/api/auth/mfa/enroll/confirm", { challengeToken, code });
        setRecoveryCodes(data.recoveryCodes ?? []);
        setSecret("");
        setOtpauthUrl("");
        setCode("");
        setStage("recovery");
      } else {
        await post("/api/auth/mfa/verify", { challengeToken, code });
        location.assign("/workspaces");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تأیید انجام نشد.");
    } finally { setBusy(false); }
  }

  return <main className="auth-page" dir="rtl"><section className="auth-panel">
    <span>VAYRO</span>
    {stage === "login" && <>
      <h1>ورود به حساب</h1>
      <form onSubmit={submitLogin}>
        <label>ایمیل<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>رمز عبور<input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button disabled={busy}>{busy ? "در حال بررسی..." : "ورود"}</button>
      </form>
      <Link href="/register">ساخت حساب</Link> · <Link href="/resend-verification">ارسال دوباره تأیید</Link> · <Link href="/forgot-password">فراموشی رمز</Link>
    </>}
    {stage === "enroll" && <>
      <h1>فعال‌سازی تأیید دومرحله‌ای</h1>
      <p>حساب مدیریتی شما باید به برنامه احراز هویت مبتنی بر TOTP متصل شود.</p>
      <p>در برنامه Authenticator گزینه افزودن حساب را انتخاب و این کلید را دستی وارد کنید:</p>
      <code dir="ltr" style={{display:"block",wordBreak:"break-all",padding:"12px"}}>{secret}</code>
      <p><a href={otpauthUrl}>بازکردن پیوند در برنامه احراز هویت</a></p>
      <form onSubmit={submitFactor}>
        <label>کد شش‌رقمی برنامه<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))}/></label>
        <button disabled={busy || code.length!==6}>{busy ? "در حال فعال‌سازی..." : "تأیید و فعال‌سازی"}</button>
      </form>
    </>}
    {stage === "verify" && <>
      <h1>تأیید دومرحله‌ای</h1>
      <p>کد شش‌رقمی برنامه احراز هویت یا یکی از کدهای بازیابی استفاده‌نشده را وارد کنید.</p>
      <form onSubmit={submitFactor}>
        <label>کد امنیتی<input dir="ltr" inputMode="text" autoComplete="one-time-code" required value={code} onChange={e=>setCode(e.target.value.trim().slice(0,32))}/></label>
        <button disabled={busy || !([6,32].includes(code.length))}>{busy ? "در حال تأیید..." : "تأیید و ورود"}</button>
      </form>
    </>}
    {stage === "recovery" && <>
      <h1>کدهای بازیابی</h1>
      <p>تأیید دومرحله‌ای فعال شد. این کدها فقط همین یک‌بار نمایش داده می‌شوند. آن‌ها را در جای امن نگهداری کنید.</p>
      <div dir="ltr" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {recoveryCodes.map(value=><code key={value}>{value}</code>)}
      </div>
      <button type="button" onClick={()=>navigator.clipboard?.writeText(recoveryCodes.join("\n"))}>کپی کدهای بازیابی</button>
      <button type="button" onClick={()=>location.assign("/workspaces")}>ذخیره کردم؛ ادامه</button>
    </>}
    <p role="alert">{message}</p>
  </section></main>;
}
