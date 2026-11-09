"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type TenantOption = { id: string; name: string };
type Generation = { id: string; kind: string; prompt: string; output: { imageUrl?: string }; createdAt: string };

export default function NegahCreativeStudioPage() {
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [history, setHistory] = useState<Generation[]>([]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    fetch("/api/tenants").then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const items = Array.isArray(data.tenants) ? data.tenants : [];
        setTenants(items);
        if (items[0]?.id) setTenantId(items[0].id);
      }).catch(() => setError("برای استفاده از نگاه، ابتدا وارد یک فضای کاری معتبر شوید."));
  }, []);

  useEffect(() => {
    if (!tenantId) { setHistory([]); return; }
    fetch("/api/tenants/" + encodeURIComponent(tenantId) + "/ai-generations")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setHistory(Array.isArray(data.generations) ? data.generations.filter((x: unknown) => !!x && typeof x === "object") : []))
      .catch(() => setHistory([]));
  }, [tenantId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setImageUrl("");
    try {
      const response = await fetch("/api/negah/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tenantId })
      });
      const data = await response.json();
      if (response.status === 401) { window.location.assign("/login"); return; }
      if (!response.ok) {
        setError(data.error === "provider_not_configured"
          ? "اتصال موتور تصویر هنوز پیکربندی نشده است."
          : "تولید تصویر انجام نشد؛ ورودی یا سرویس را بررسی کنید.");
        return;
      }
      setImageUrl(data.result.imageUrl);
      setHistory(items => [{ id: data.generationId, kind: "NEGAH_IMAGE", prompt, output: data.result, createdAt: data.createdAt }, ...items].slice(0, 50));
    } catch {
      setError("ارتباط با سرویس برقرار نشد.");
    } finally { setBusy(false); }
  }

  return (
    <main className="page-shell" dir="rtl">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">V</span><span><strong>وایرو</strong><small>VAYRO · NEGAH</small></span></Link>
        <Link className="secondary-action" href="/ai-business-suite">فهرست قابلیت‌ها</Link>
      </header>
      <section className="prompt-hero">
        <span className="eyebrow">NEGAH · CREATIVE STUDIO</span>
        <h1>استودیوی تولید تصویر</h1>
        <p>شرح تصویر موردنظر را بنویسید. پس از پیکربندی امن ارائه‌دهنده، خروجی واقعی در این صفحه نمایش داده می‌شود.</p>
        <div className="prompt-disclosure">این نسخه به API سازگار با OpenAI متصل می‌شود. تا زمان اتصال دفترکل اعتبار و ذخیره‌سازی پایدار، صورتحساب و نگهداری دائمی خروجی فعال نیست.</div>
      </section>
      <section className="prompt-layout">
        <form className="prompt-form" onSubmit={submit}>
          <label>فضای کاری
            <select value={tenantId} onChange={event => setTenantId(event.target.value)} required disabled={!tenants.length}>
              {tenants.map(tenant => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
            </select>
          </label>
          <label>شرح تصویر<textarea value={prompt} onChange={event => setPrompt(event.target.value)} required minLength={3} maxLength={4000} rows={6} placeholder="موضوع، سبک، ترکیب‌بندی و جزئیات تصویر..." /></label>
          <button type="submit" disabled={busy || !tenantId || prompt.trim().length < 3}>{busy ? "در حال تولید..." : "تولید تصویر"}</button>
          {error && <p className="prompt-error" role="alert">{error}</p>}
        </form>
        <aside className="prompt-result">
          <h2>خروجی تصویر</h2>
          {imageUrl ? <Image src={imageUrl} alt="خروجی تولیدشده در استودیوی نگاه" width={1024} height={1024} unoptimized style={{ width: "100%", height: "auto", borderRadius: 16 }} /> : <p className="prompt-placeholder">پس از اجرای موفق، تصویر اینجا نمایش داده می‌شود.</p>}
        </aside>
      </section>
      <section className="prompt-result" aria-labelledby="negah-history-title">
        <h2 id="negah-history-title">تاریخچه تصاویر این فضای کاری</h2>
        {!history.length ? <p className="prompt-placeholder">هنوز تصویری ثبت نشده است.</p> : (
          <ul>
            {history.map(item => (
              <li key={item.id}>
                <p><strong>{item.prompt}</strong></p>
                {item.output?.imageUrl && <Image src={item.output.imageUrl} alt={item.prompt} width={480} height={480} unoptimized loading="lazy" style={{ width: "min(100%, 480px)", height: "auto", borderRadius: 16 }} />}
                <p><small>{new Date(item.createdAt).toLocaleString("fa-IR")}</small></p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
