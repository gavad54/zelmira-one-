"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Workspace = {
  id: string;
  name: string;
  slug: string;
  status: string;
  role: string;
  createdAt: string;
};

export default function WorkspacesPage() {
  const [items, setItems] = useState<Workspace[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/tenants", { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error("دریافت فهرست سازمان‌ها ناموفق بود.");
      setItems(Array.isArray(data.tenants) ? data.tenants : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (response.status === 403 && data.error === "email_verification_required") {
        throw new Error("برای ساخت سازمان ابتدا باید ایمیل حساب خود را تأیید کنید.");
      }
      if (!response.ok) {
        const messages: Record<string, string> = {
          invalid_input: "نام سازمان باید بین ۲ تا ۱۰۰ نویسه باشد.",
          try_again_later: "تعداد درخواست‌ها زیاد است؛ بعداً دوباره تلاش کنید."
        };
        throw new Error(messages[data.error] || "ساخت سازمان انجام نشد.");
      }
      setName("");
      setNotice("سازمان با موفقیت ساخته شد و دسترسی مالک برای شما ثبت شد.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ساخت سازمان ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="workspace-page" dir="rtl">
      <header className="workspace-header">
        <Link href="/" className="workspace-brand"><span>V</span><strong>VAYRO</strong></Link>
        <Link href="/" className="workspace-home">صفحه اصلی</Link>
      </header>
      <section className="workspace-intro">
        <span className="workspace-kicker">VAYRO CORE · WORKSPACES</span>
        <h1>فضاهای کاری شما</h1>
        <p>سازمان‌های خود را ایجاد و مدیریت کنید. اطلاعات هر سازمان بر اساس عضویت و مجوزهای همان سازمان محافظت می‌شود.</p>
      </section>

      <section className="workspace-panel">
        <h2>ایجاد سازمان جدید</h2>
        <form className="workspace-form" onSubmit={createWorkspace}>
          <label htmlFor="workspace-name">نام سازمان یا کسب‌وکار</label>
          <div className="workspace-form-row">
            <input id="workspace-name" value={name} onChange={event => setName(event.target.value)} minLength={2} maxLength={100} required placeholder="مثلاً شرکت توسعه فناوری" />
            <button type="submit" disabled={saving || name.trim().length < 2}>{saving ? "در حال ایجاد..." : "ایجاد سازمان"}</button>
          </div>
        </form>
        {notice && <p className="workspace-notice" role="status">{notice}</p>}
        {error && <p className="workspace-error" role="alert">{error}</p>}
      </section>

      <section className="workspace-list">
        <div className="workspace-list-heading"><h2>سازمان‌های من</h2><button type="button" className="workspace-refresh" onClick={() => void load()} disabled={loading}>به‌روزرسانی</button></div>
        {loading ? <p className="workspace-muted">در حال دریافت اطلاعات...</p> :
          items.length === 0 ? <div className="workspace-empty"><strong>هنوز سازمانی ایجاد نکرده‌اید.</strong><p>برای شروع، نام سازمان خود را در بخش بالا وارد کنید.</p></div> :
          <div className="workspace-cards">{items.map(item => (
            <article className="workspace-card" key={item.id}>
              <div><h3>{item.name}</h3><p>{item.slug}</p></div>
              <div className="workspace-meta"><span>{item.role === "OWNER" ? "مالک" : item.role}</span><span>{item.status === "ACTIVE" ? "فعال" : item.status}</span></div>
              <Link className="workspace-open-link" href={`/workspaces/${encodeURIComponent(item.id)}`}>ورود به فضای کاری ←</Link>
            </article>
          ))}</div>
        }
      </section>
      <p className="workspace-footnote">برای حفاظت از اطلاعات، فقط سازمان‌هایی نمایش داده می‌شوند که حساب شما در آن‌ها عضویت معتبر دارد.</p>
    </main>
  );
}
