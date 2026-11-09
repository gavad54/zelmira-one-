"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import "./prompt-studio.css";

type FormState = {
  business: string;
  goal: string;
  audience: string;
  tone: string;
  context: string;
  constraints: string;
  outputFormat: string;
};

const initial: FormState = {
  business: "", goal: "", audience: "", tone: "حرفه‌ای، روشن و دقیق",
  context: "", constraints: "", outputFormat: "گام‌به‌گام همراه با مثال و جمع‌بندی اجرایی"
};

export default function PromptStudioPage() {
  const [form, setForm] = useState<FormState>(initial);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function update(field: keyof FormState, value: string) {
    setForm(current => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setPrompt(""); setCopied(false);
    try {
      const response = await fetch("/api/dana/prompt-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (response.status === 401) { window.location.assign("/login"); return; }
      if (!response.ok) throw new Error(data.error === "invalid_input" ? "لطفاً همه فیلدهای ضروری را درست تکمیل کنید." : "ساخت پرامپت انجام نشد.");
      setPrompt(data.prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ارتباط با سرور برقرار نشد.");
    } finally { setBusy(false); }
  }

  async function copyPrompt() {
    try { await navigator.clipboard.writeText(prompt); setCopied(true); }
    catch { setError("کپی خودکار در این مرورگر در دسترس نیست؛ متن را انتخاب و کپی کنید."); }
  }

  return (
    <main className="page-shell prompt-studio-page" dir="rtl">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">V</span><span><strong>وایرو</strong><small>VAYRO · DANA</small></span></Link>
        <Link className="secondary-action" href="/ai-business-suite">فهرست ۵۰ قابلیت</Link>
      </header>
      <section className="prompt-hero">
        <span className="eyebrow">DANA · BUSINESS PROMPT STUDIO</span>
        <h1>پرامپت تخصصی کسب‌وکار بسازید.</h1>
        <p>اطلاعات مسئله را وارد کنید تا یک دستور ساختاریافته و قابل‌استفاده برای ابزار هوش مصنوعی دریافت کنید.</p>
        <div className="prompt-disclosure">این نسخه موتور قالب‌سازی پرامپت است؛ خودش مدل هوش مصنوعی را اجرا نمی‌کند و هزینه API ندارد.</div>
      </section>
      <section className="prompt-layout">
        <form className="prompt-form" onSubmit={submit}>
          <label>حوزه کسب‌وکار<input value={form.business} onChange={e=>update("business",e.target.value)} required minLength={2} maxLength={1200} placeholder="مثلاً فروشگاه آنلاین پوشاک" /></label>
          <label>هدف دقیق<input value={form.goal} onChange={e=>update("goal",e.target.value)} required minLength={2} maxLength={1200} placeholder="مثلاً افزایش نرخ تبدیل صفحه محصول" /></label>
          <label>مخاطب هدف<input value={form.audience} onChange={e=>update("audience",e.target.value)} required minLength={2} maxLength={1200} placeholder="مثلاً مشتریان ۲۰ تا ۴۰ سال" /></label>
          <label>لحن و سبک<input value={form.tone} onChange={e=>update("tone",e.target.value)} required minLength={2} maxLength={1200} /></label>
          <label>زمینه و اطلاعات تکمیلی<textarea value={form.context} onChange={e=>update("context",e.target.value)} maxLength={3000} rows={3} placeholder="محصول، بازار، محدودیت‌ها و اطلاعات موجود..." /></label>
          <label>محدودیت‌ها و معیارها<textarea value={form.constraints} onChange={e=>update("constraints",e.target.value)} maxLength={3000} rows={3} placeholder="بودجه، قوانین، منابع مجاز و موارد ممنوع..." /></label>
          <label>قالب خروجی<input value={form.outputFormat} onChange={e=>update("outputFormat",e.target.value)} required minLength={2} maxLength={1200} /></label>
          <button type="submit" disabled={busy}>{busy ? "در حال ساخت..." : "ساخت پرامپت تخصصی"}</button>
        </form>
        <aside className="prompt-result">
          <div className="prompt-result-heading"><h2>خروجی شما</h2>{prompt && <button type="button" onClick={copyPrompt}>{copied ? "کپی شد" : "کپی متن"}</button>}</div>
          {prompt ? <pre>{prompt}</pre> : <p className="prompt-placeholder">پس از تکمیل فرم، پرامپت ساختاریافته در این بخش نمایش داده می‌شود.</p>}
          {error && <p className="prompt-error" role="alert">{error}</p>}
        </aside>
      </section>
      <footer className="footer"><span>© {new Date().getFullYear()} VAYRO</span><span>DANA PROMPT STUDIO</span></footer>
    </main>
  );
}
