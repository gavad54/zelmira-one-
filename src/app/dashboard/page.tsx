"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PLATFORM_CAPABILITIES } from "@/lib/product-directory.mjs";

type ProductStatus = "PLANNED" | "ACTIVE" | "MAINTENANCE" | "RETIRED";
type Product = {
  id: string;
  key: string;
  name: string;
  description: string;
  status: ProductStatus;
  baseUrl: string | null;
  licenseCount: number;
  updatedAt: string;
};
type Metrics = { totalProducts: number; totalTenants: number; activeLicenses: number; allLicenses: number };

const statusLabels: Record<ProductStatus, string> = {
  PLANNED: "در برنامه",
  ACTIVE: "فعال",
  MAINTENANCE: "در حال نگهداری",
  RETIRED: "بازنشسته"
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
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/owner/products", { cache: "no-store" });
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error("دریافت اطلاعات داشبورد ممکن نشد؛ اتصال امن هسته و دسترسی مالک را بررسی کنید.");
      const rows = Array.isArray(data.products) ? data.products as Product[] : [];
      setProducts(rows);
      setMetrics(data.metrics ?? null);
      setDrafts(Object.fromEntries(rows.map(product => [
        product.id,
        { status: product.status, baseUrl: product.baseUrl ?? "" }
      ])));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "خطای ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function initializeCatalog() {
    setInitializing(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/owner/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize_catalog" })
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error("راه‌اندازی کاتالوگ انجام نشد؛ دسترسی مالک و اتصال هسته را بررسی کنید.");
      setNotice(`کاتالوگ بررسی شد؛ ${data.initialized} محصول مستقل ثبت/بررسی شد. وضعیت‌های قبلی تغییر نکردند.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "خطا در راه‌اندازی کاتالوگ.");
    } finally {
      setInitializing(false);
    }
  }

  async function saveProduct(product: Product) {
    const draft = drafts[product.id];
    if (!draft) return;
    setSavingId(product.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/owner/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          status: draft.status,
          baseUrl: draft.baseUrl.trim() ? draft.baseUrl.trim() : null
        })
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) {
        const messages: Record<string, string> = {
          active_product_requires_url: "برای فعال‌کردن محصول، ابتدا نشانی HTTPS معتبر ثبت کنید.",
          https_url_required: "نشانی محصول باید با HTTPS معتبر باشد.",
          invalid_url: "نشانی واردشده معتبر نیست."
        };
        throw new Error(messages[data.error] || "ذخیره تنظیمات محصول انجام نشد.");
      }
      setNotice(`تنظیمات ${product.name} ذخیره شد.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "خطا در ذخیره اطلاعات.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <main className="owner-dashboard" dir="rtl">
      <header className="owner-dashboard-header">
        <Link className="brand" href="/">
          <strong>VAYRO</strong>
          <small>OWNER CONTROL CENTER</small>
        </Link>
        <nav aria-label="ناوبری داشبورد">
          <Link href="/">صفحه اصلی</Link>
          <Link href="/workspaces">فضاهای کاری</Link>
        </nav>
      </header>

      <section className="owner-dashboard-intro">
        <span className="eyebrow">OWNER CONTROL CENTER</span>
        <h1>داشبورد مدیریت وایرو</h1>
        <p>نمای مدیریتی متصل به VAYRO-CORE. این صفحه هفت محصول خانواده، سه محصول مستقل و شاخص‌های واقعی هسته را جدا از قابلیت‌های پلتفرمی نمایش می‌دهد.</p>
      </section>

      {error && <p className="owner-error" role="alert">{error}</p>}
      {notice && <p className="owner-notice" role="status">{notice}</p>}

      <section className="owner-metrics" aria-label="شاخص‌های هسته VAYRO">
        {[
          ["محصولات ثبت‌شده", metrics?.totalProducts],
          ["سازمان‌ها", metrics?.totalTenants],
          ["مجوزهای فعال", metrics?.activeLicenses],
          ["کل مجوزها", metrics?.allLicenses]
        ].map(([label, value]) => (
          <article key={String(label)}>
            <span>{label}</span>
            <strong>{loading ? "…" : value === undefined ? "—" : Number(value).toLocaleString("fa-IR")}</strong>
          </article>
        ))}
      </section>

      <section className="owner-products-panel" aria-labelledby="owner-products-title">
        <div className="owner-products-heading">
          <div>
            <span className="eyebrow">PRODUCT OPERATIONS</span>
            <h2 id="owner-products-title">مدیریت هفت محصول خانواده و سه محصول مستقل</h2>
          </div>
          <div>
            <button type="button" onClick={() => void load()} disabled={loading}>بازخوانی</button>
            <button type="button" onClick={() => void initializeCatalog()} disabled={initializing || loading}>
              {initializing ? "در حال بررسی…" : "ثبت کاتالوگ پایه"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="owner-dashboard-footnote">در حال دریافت اطلاعات از هسته…</p>
        ) : products.length === 0 ? (
          <div className="owner-empty">
            <p>هنوز محصولی در کاتالوگ هسته ثبت نشده است.</p>
            <p className="owner-dashboard-footnote">ثبت کاتالوگ پایه فقط محصولاتِ مفقود را با وضعیت «در برنامه» اضافه می‌کند و وضعیت‌های قبلی را تغییر نمی‌دهد.</p>
          </div>
        ) : (
          <div className="owner-product-grid">
            {products.map(product => {
              const draft = drafts[product.id] ?? { status: product.status, baseUrl: product.baseUrl ?? "" };
              return (
                <article className="owner-product-card" key={product.id}>
                  <div className="owner-product-title">
                    <div>
                      <h3>{product.name}</h3>
                      <span>{product.description}</span>
                    </div>
                    <strong>{statusLabels[product.status]}</strong>
                  </div>
                  <label>
                    وضعیت محصول
                    <select
                      value={draft.status}
                      onChange={event => setDrafts(current => ({
                        ...current,
                        [product.id]: { ...draft, status: event.target.value as ProductStatus }
                      }))}
                    >
                      {statusOptions.map(status => <option key={status} value={status}>{statusLabels[status]}</option>)}
                    </select>
                  </label>
                  <label>
                    نشانی رسمی محصول (HTTPS)
                    <input
                      type="url"
                      inputMode="url"
                      placeholder="https://product.example"
                      value={draft.baseUrl}
                      onChange={event => setDrafts(current => ({
                        ...current,
                        [product.id]: { ...draft, baseUrl: event.target.value }
                      }))}
                    />
                  </label>
                  <div className="owner-product-meta">
                    <span>مجوزها: {product.licenseCount.toLocaleString("fa-IR")}</span>
                    <span>به‌روزرسانی: {new Date(product.updatedAt).toLocaleDateString("fa-IR")}</span>
                  </div>
                  <button type="button" onClick={() => void saveProduct(product)} disabled={savingId === product.id}>
                    {savingId === product.id ? "در حال ذخیره…" : "ذخیره تغییرات"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="owner-products-panel" aria-labelledby="owner-platform-capabilities-title">
        <div className="owner-products-heading">
          <div>
            <span className="eyebrow">PLATFORM CAPABILITIES</span>
            <h2 id="owner-platform-capabilities-title">قابلیت‌های درون پلتفرم</h2>
          </div>
        </div>
        <div className="owner-product-grid">
          {PLATFORM_CAPABILITIES.map(capability => (
            <article className="owner-product-card" key={capability.name}>
              <div className="owner-product-title">
                <div>
                  <h3>{capability.name}</h3>
                  <span>{capability.detail}</span>
                </div>
                <strong>قابلیت پلتفرمی</strong>
              </div>
              <p className="owner-dashboard-footnote">{capability.status}</p>
              <Link className="secondary-action" href={capability.href}>ورود به فضای DANA</Link>
            </article>
          ))}
        </div>
      </section>

      <p className="owner-dashboard-footnote">ثبت نشانی HTTPS یا انتخاب وضعیت «فعال» به‌تنهایی سلامت، اتصال، امنیت یا انتشار محصول را اثبات نمی‌کند. هر تغییر مدیریتی در گزارش ممیزی ثبت می‌شود.</p>
    </main>
  );
}
