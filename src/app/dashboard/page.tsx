"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ProductStatus = "PLANNED" | "ACTIVE" | "MAINTENANCE" | "RETIRED";
type Product = {
  id: string; key: string; name: string; description: string;
  status: ProductStatus; baseUrl: string | null; licenseCount: number;
  updatedAt: string;
};
type Metrics = { totalProducts: number; totalTenants: number; activeLicenses: number; allLicenses: number };
const statusLabels: Record<ProductStatus, string> = {
  PLANNED: "در برنامه", ACTIVE: "فعال", MAINTENANCE: "در تعمیر و نگهداری", RETIRED: "بازنشسته"
};
const statusOptions: ProductStatus[] = ["PLANNED", "ACTIVE", "MAINTENANCE", "RETIRED"];

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { status: ProductStatus; baseUrl: string }>>({});

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/owner/products", { cache: "no-store" });
      if (response.status === 401) { window.location.assign("/login"); return; }
      const data = await response.json();
      if (!response.ok) throw new Error("دریافت اطلاعات داشبورد ممکن نشد. اتصال پایگاه داده و دسترسی مالک را بررسی کنید.");
      const rows = Array.isArray(data.products) ? data.products as Product[] : [];
      setProducts(rows);
      setMetrics(data.metrics ?? null);
      setDrafts(Object.fromEntries(rows.map(p => [p.id, { status: p.status, baseUrl: p.baseUrl ?? "" }])));
    } catch (e) { setError(e instanceof Error ? e.message : "خطای ارتباط با سرور."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function initializeCatalog() {
    setInitializing(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/owner/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize_catalog" })
      });
      const data = await response.json();
      if (response.status === 401) { window.location.assign("/login"); return; }
      if (!response.ok) throw new Error(data.error === "catalog_initialization_failed" ? "راه‌اندازی کاتالوگ انجام نشد؛ اتصال پایگاه داده را بررسی کنید." : "درخواست راه‌اندازی کاتالوگ پذیرفته نشد.");
      setNotice(`کاتالوگ پایه بررسی شد؛ ${data.initialized} محصول در عملیات ثبت/بررسی قرار گرفت.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "خطا در راه‌اندازی کاتالوگ."); }
    finally { setInitializing(false); }
  }

  async function saveProduct(product: Product) {
    const draft = drafts[product.id];
    if (!draft) return;
    setSavingId(product.id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/owner/products", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id, status: draft.status,
          baseUrl: draft.baseUrl.trim() ? draft.baseUrl.trim() : null
        })
      });
      const data = await response.json();
      if (response.status === 401) { window.location.assign("/login"); return; }
      if (!response.ok) {
        const messages: Record<string, string> = {
          active_product_requires_url: "برای فعال‌کردن محصول، ابتدا نشانی HTTPS معتبر ثبت کنید.",
          https_url_required: "نشانی محصول باید با HTTPS شروع شود.",
          invalid_url: "نشانی واردشده معتبر نیست."
        };
        throw new Error(messages[data.error] || "ذخیره تنظیمات محصول انجام نشد.");
      }
      setNotice(`تنظیمات ${product.name} ذخیره شد.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "خطا در ذخیره اطلاعات."); }
    finally { setSavingId(""); }
  }

  return (
    <main className="owner-dashboard" dir="rtl">
      <header className="owner-dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark-text">V</span><span><strong>وایرو</strong><small>VAYRO CORE</small></span></Link>
        <nav aria-label="ناوبری داشبورد"><Link href="/">صفحه عمومی</Link><Link href="/workspaces">فضاهای کاری</Link><Link href="/settings">تنظیمات</Link></nav>
      </header>
      <section className="owner-dashboard-intro">
        <span className="eyebrow">OWNER CONTROL CENTER</span>
        <h1>داشبورد مدیریت وایرو</h1>
        <p>نمای مدیریتی متصل به داده‌های هسته VAYRO-CORE. اعداد این صفحه از پایگاه داده دریافت می‌شوند و در صورت قطع سرویس، وضعیت خطا نمایش داده می‌شود.</p>
      </section>

      {error && <p className="owner-error" role="alert">{error}</p>}
      {notice && <p className="owner-notice" role="status">{notice}</p>}

      <section className="owner-metrics" aria-label="شاخص‌های واقعی هسته">
        {[
          ["محصولات ثبت‌شده", metrics?.totalProducts],
          ["سازمان‌ها", metrics?.totalTenants],
          ["مجوزهای فعال", metrics?.activeLicenses],
          ["کل مجوزها", metrics?.allLicenses]
        ].map(([label, value]) => <article key={String(label)}><span>{label}</span><strong>{loading ? "…" : value === undefined ? "—" : Number(value).toLocaleString("fa-IR")}</strong></article>)}
      </section>

      <section className="owner-products-panel">
        <div className="owner-products-heading">
          <div><span className="eyebrow">PRODUCT OPERATIONS</span><h2>مدیریت خانواده محصولات</h2></div>
          <button type="button" onClick={initializeCatalog} disabled={initializing || loading}>{initializing ? "در حال بررسی…" : "راه‌اندازی کاتالوگ پایه"}</button>
        </div>
        {loading ? <p className="owner-dashboard-footnote">در حال دریافت اطلاعات از سرور…</p> :
          products.length === 0 ? <div className="owner-empty"><p>هنوز محصولی در کاتالوگ هسته ثبت نشده است.</p><p className="owner-dashboard-footnote">با راه‌اندازی کاتالوگ پایه، محصولات با وضعیت «در برنامه» ثبت می‌شوند؛ هیچ محصولی خودکار فعال یا منتشر نمی‌شود.</p></div> :
          <div className="owner-product-grid">{products.map(product => {
            const draft = drafts[product.id] ?? { status: product.status, baseUrl: product.baseUrl ?? "" };
            return <article className="owner-product-card" key={product.id}>
              <div className="owner-product-title"><div><h3>{product.name}</h3><span>{product.description}</span></div><strong>{statusLabels[product.status]}</strong></div>
              <label>وضعیت محصول<select value={draft.status} onChange={e => setDrafts(old => ({ ...old, [product.id]: { ...draft, status: e.target.value as ProductStatus } }))}>{statusOptions.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select></label>
              <label>نشانی رسمی محصول (HTTPS)<input type="url" inputMode="url" placeholder="https://product.example" value={draft.baseUrl} onChange={e => setDrafts(old => ({ ...old, [product.id]: { ...draft, baseUrl: e.target.value } }))} /></label>
              <div className="owner-product-meta"><span>مجوزها: {product.licenseCount.toLocaleString("fa-IR")}</span><span>به‌روزرسانی: {new Date(product.updatedAt).toLocaleDateString("fa-IR")}</span></div>
              <button type="button" onClick={() => void saveProduct(product)} disabled={savingId === product.id}>{savingId === product.id ? "در حال ذخیره…" : "ذخیره تغییرات"}</button>
            </article>;
          })}</div>
        }
      </section>
      <p className="owner-dashboard-footnote">تغییر وضعیت «فعال» فقط با نشانی HTTPS معتبر پذیرفته می‌شود. ثبت نشانی به معنی تأیید سلامت، اتصال یا انتشار محصول نیست. هر تغییر مدیریتی در گزارش ممیزی ثبت می‌شود.</p>
    </main>
  );
}
