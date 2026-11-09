"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type TenantOption = { id: string; name: string };
type Generation = { id: string; kind: string; prompt: string; output: { text?: string }; createdAt: string };

export default function DanaWorkspacePage() {
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [history, setHistory] = useState<Generation[]>([]);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/tenants").then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const items = Array.isArray(data.tenants) ? data.tenants : [];
        setTenants(items);
        if (items[0]?.id) setTenantId(items[0].id);
      }).catch(() => setError("برای استفاده از دانا، ابتدا وارد یک فضای کاری معتبر شوید."));
  }, []);

  useEffect(() => {
    if (!tenantId) { setHistory([]); return; }
    fetch("/api/tenants/" + encodeURIComponent(tenantId) + "/ai-generations")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setHistory(Array.isArray(data.generations) ? data.generations.filter((x: unknown) => !!x && typeof x === "object") : []))
      .catch(() => setHistory([]));
  }, [tenantId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setResult("");
    try {
      const response = await fetch("/api/dana/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tenantId })
      });
      const data = await response.json();
      if (response.status === 401) { window.location.assign("/login"); return; }
      if (!response.ok) {
        setError(data.error === "provider_not_configured"
          ? "اتصال موتور هوش مصنوعی هنوز پیکربندی نشده است."
          : "پاسخی دریافت نشد؛ ورودی یا سرویس را بررسی کنید.");
        return;
      }
      setResult(data.result.text);
      setHistory(items => [{ id: data.generationId, kind: "DANA_TEXT", prompt, output: data.result, createdAt: data.createdAt }, ...items].slice(0, 50));
    } catch { setError("ارتباط با سرویس برقرار نشد."); }
    finally { setBusy(false); }
  }

  return (
    <main className="page-shell" dir="rtl">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">V</span><span><strong>وایرو</strong><small>VAYRO · DANA</small></span></Link>
        <Link className="secondary-action" href="/dana/prompt-studio">استودیوی پرامپت</Link>
      </header>
      <section className="prompt-hero">
        <span className="eyebrow">DANA · AI WORKSPACE</span>
        <h1>فضای کار هوشمند دانا</h1>
        <p>درخواست متنی خود را وارد کنید و پاسخ موتور زبانی متصل را دریافت کنید.</p>
        <div className="prompt-disclosure">اتصال ارائه‌دهنده از طریق تنظیمات سرور انجام می‌شود. تا زمان راه‌اندازی دفترکل اعتبار و ذخیره‌سازی، این محیط صورتحساب‌گذاری یا نگهداری دائمی ندارد.</div>
      </section>
      <section className="prompt-layout">
        <form className="prompt-form" onSubmit={submit}>
          <label>فضای کاری
            <select value={tenantId} onChange={event => setTenantId(event.target.value)} required disabled={!tenants.length}>
              {tenants.map(tenant => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
            </select>
          </label>
          <label>درخواست شما<textarea value={prompt} onChange={event => setPrompt(event.target.value)} required minLength={2} maxLength={12000} rows={8} placeholder="درخواست، مسئله یا متن موردنظر را بنویسید..." /></label>
          <button type="submit" disabled={busy || !tenantId || prompt.trim().length < 2}>{busy ? "در حال پردازش..." : "ارسال به دانا"}</button>
          {error && <p className="prompt-error" role="alert">{error}</p>}
        </form>
        <aside className="prompt-result">
          <h2>پاسخ دانا</h2>
          {result ? <pre style={{ whiteSpace: "pre-wrap" }}>{result}</pre> : <p className="prompt-placeholder">پاسخ پس از اجرای موفق اینجا نمایش داده می‌شود.</p>}
        </aside>
      </section>
      <section className="prompt-result" aria-labelledby="dana-history-title">
        <h2 id="dana-history-title">تاریخچه درخواست‌های این فضای کاری</h2>
        {!history.length ? <p className="prompt-placeholder">هنوز درخواستی ثبت نشده است.</p> : (
          <ul>
            {history.map(item => (
              <li key={item.id}>
                <p><strong>{item.prompt}</strong></p>
                {item.output?.text && <p style={{ whiteSpace: "pre-wrap" }}>{item.output.text}</p>}
                <small>{new Date(item.createdAt).toLocaleString("fa-IR")}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
