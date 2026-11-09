"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Product = {
  id: string;
  key: string;
  name: string;
  description: string;
  status: "PLANNED" | "ACTIVE" | "MAINTENANCE" | "RETIRED";
  baseUrl: string | null;
  licenseCount: number;
  updatedAt: string;
};

type Metrics = { totalProducts: number; totalTenants: number; activeLicenses: number; allLicenses: number };

const statusLabels: Record<Product["status"], string> = {
  PLANNED: "در برنامه",
  ACTIVE: "فعال",
  MAINTENANCE: "در حال نگهداری",
  RETIRED: "بازنشسته"
};

export default function OwnerDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ totalProducts: 0, totalTenants: 0, activeLicenses: 0, allLicenses: 0 });
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, Product["status"]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/owner/products", { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) { window.location.assign("/login"); return; }
      if (!response.ok) throw new Error("دریافت اطلاعات داشبورد ناموفق بود.");
      const items = Array.isArray(data.products) ? data.products as Product[] : [];
      setProducts(items);
      setMetrics(data.metrics);
      setUrls(Object.fromEntries(items.map(item => [item.id, item.baseUrl ?? ""])));
      setStatuses(Object.fromEntries(items.map(item => [item.id, item.status])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت اطلاعات.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function initializeCatalog() {
    setBusy("initialize"); setError(""); setNotice("");
    try {
      const response = await fetch("/api/owner/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize_catalog" })
      });
      const data = await response.json();
      if (response.status === 401) { window.location.assign("/login"); return; }
      if (!response.ok) throw new Error("ثبت کاتالوگ محصولات انجام نشد.");
      setNotice(data.initialized + " محصول در کاتالوگ مرکزی ثبت شد؛ وضعیت و تنظیمات قبلی حفظ شده‌اند.");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "عملیات انجام نشد."); }
    finally { setBusy(""); }
  }

  async function saveProduct(product: Product) {
    setBusy(product.id); setError(""); setNotice("");
    try {
      const baseUrl = urls[product.id]?.trim() ?? "";
      const response = await fetch("/api/owner/products", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, status: statuses[product.id], baseUrl: baseUrl || null })
      });
      const data = await response.json();
      if (response.status === 401) { window.location.assign("/login"); return; }
      const errors: Record<string, string> = {
        active_product_requires_url: "برای فعال‌سازی، ابتدا نشانی HTTPS محصول را ثبت کنید.",
        https_url_required: "نشانی محصول باید امن و با HTTPS باشد.",
        invalid_url: "نشانی واردشده معتبر نیست."
      };
      if (!response.ok) throw new Error(errors[data.error] ?? "ذخیره تنظیمات محصول ناموفق بود.");
      setNotice("تنظیمات " + product.name + " ذخیره شد.");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "ذخیره انجام نشد."); }
    finally { setBusy(""); }
  }

  return (
    <main className="owner-dashboard" dir="rtl">
      <header className="owner-dashboard-header">
        <Link href="/" className="workspace-brand"><span>V</span><strong>VAYRO CORE</strong></Link>
        <nav><Link href="/owner/email-settings">مدیریت ایمیل</Link><Link href="/">صفحه عمومی</Link></nav>
      </header>
      <section className="owner-dashboard-intro">
        <span className="workspace-kicker">VAYRO · PLATFORM CONTROL</span>
        <h1>داشبورد مرکزی مدیریت</h1>
        <p>نمای کلی هسته وایرو و مدیریت وضعیت کاتالوگ یازده اپلیکیشن. این پنل فقط برای حساب مالک تأییدشده قابل دسترسی است.</p>
      </section>

      <section className="owner-metrics" aria-label="شاخص‌های مرکزی">
        <article><span>محصولات ثبت‌شده</span><strong>{metrics.totalProducts} / 11</strong></article>
        <article><span>سازمان‌ها</span><strong>{metrics.totalTenants}</strong></article>
        <article><span>مجوزهای فعال</span><strong>{metrics.activeLicenses}</strong></article>
        <article><span>کل مجوزها</span><strong>{metrics.allLicenses}</strong></article>
      </section>

      {notice && <p className="owner-notice" role="status">{notice}</p>}
      {error && <p className="owner-error" role="alert">{error}</p>}

      <section className="owner-products-panel">
        <div className="owner-products-heading">
          <div><span className="workspace-kicker">PRODUCT GOVERNANCE</span><h2>مدیریت یازده محصول</h2></div>
          <button type="button" onClick={() => void load()} disabled={loading || !!busy}>به‌روزرسانی</button>
        </div>
        {loading ? <p className="workspace-muted">در حال دریافت اطلاعات امن...</p> :
          products.length === 0 ? <div className="workspace-empty">
            <strong>کاتالوگ هنوز در پایگاه داده ثبت نشده است.</strong>
            <p>با این عملیات فقط یازده رکورد پایه ساخته می‌شود؛ هیچ محصولی فعال یا منتشر نخواهد شد.</p>
            <button type="button" onClick={() => void initializeCatalog()} disabled={!!busy}>{busy === "initialize" ? "در حال ثبت..." : "ثبت اولیه یازده محصول"}</button>
          </div> :
          <div className="owner-product-grid">{products.map(product => (
            <article className="owner-product-card" key={product.id}>
              <div className="owner-product-title"><div><h3>{product.name}</h3><span>{product.description}</span></div><strong>{product.licenseCount} مجوز</strong></div>
              <label>وضعیت محصول
                <select value={statuses[product.id] ?? product.status} onChange={event => setStatuses(current => ({ ...current, [product.id]: event.target.value as Product["status"] }))}>
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>نشانی امن محصول (HTTPS)
                <input type="url" dir="ltr" placeholder="https://product.example.com" value={urls[product.id] ?? ""} onChange={event => setUrls(current => ({ ...current, [product.id]: event.target.value }))} />
              </label>
              <button type="button" onClick={() => void saveProduct(product)} disabled={!!busy || (statuses[product.id] === "ACTIVE" && !urls[product.id]?.trim())}>
                {busy === product.id ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </article>
          ))}</div>
        }
      </section>
      <p className="owner-dashboard-footnote">فعال‌کردن وضعیت در این پنل صرفاً وضعیت کاتالوگ را تغییر می‌دهد؛ به‌معنای تکمیل فنی، سلامت سرویس، فعال‌شدن پرداخت یا انتشار عمومی آن محصول نیست. هر تغییر با شناسه مالک در گزارش ممیزی ثبت می‌شود.</p>
    </main>
  );
}
