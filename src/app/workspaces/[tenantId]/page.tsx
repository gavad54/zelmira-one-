"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Product = {
  licenseId: string;
  key: string;
  name: string;
  description: string;
  status: string;
  baseUrl: string | null;
  startsAt: string;
  endsAt: string | null;
};

type Workspace = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  memberCount: number;
  products: Product[];
};

export default function WorkspaceDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}`, {
        cache: "no-store"
      });
      const data = await response.json();
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (response.status === 404) {
        throw new Error("این سازمان فعال نیست یا در دسترس شما قرار ندارد.");
      }
      if (!response.ok) {
        throw new Error("دریافت اطلاعات فضای کاری ممکن نشد. دوباره تلاش کنید.");
      }
      setWorkspace(data.tenant);
      setRole(data.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="workspace-page" dir="rtl">
      <header className="workspace-header">
        <Link href="/" className="workspace-brand"><span>V</span><strong>VAYRO</strong></Link>
        <Link href="/workspaces" className="workspace-home">همه سازمان‌ها</Link>
      </header>

      {loading ? (
        <section className="workspace-detail-state" role="status">در حال دریافت فضای کاری...</section>
      ) : error ? (
        <section className="workspace-detail-state" role="alert">
          <h1>فضای کاری در دسترس نیست</h1>
          <p>{error}</p>
          <button type="button" onClick={() => void load()}>تلاش دوباره</button>
          <Link href="/workspaces">بازگشت به سازمان‌ها</Link>
        </section>
      ) : workspace ? (
        <>
          <section className="workspace-intro">
            <span className="workspace-kicker">VAYRO CORE · ORGANIZATION</span>
            <h1>{workspace.name}</h1>
            <p>محیط مدیریت سازمان شما؛ دسترسی‌ها و محصولات بر اساس عضویت معتبر سمت سرور کنترل می‌شوند.</p>
          </section>

          <section className="workspace-summary-grid" aria-label="خلاصه سازمان">
            <article className="workspace-summary-card">
              <span>نقش شما</span>
              <strong>{role === "OWNER" ? "مالک" : role === "ADMIN" ? "مدیر" : role}</strong>
            </article>
            <article className="workspace-summary-card">
              <span>اعضای سازمان</span>
              <strong>{workspace.memberCount.toLocaleString("fa-IR")}</strong>
            </article>
            <article className="workspace-summary-card">
              <span>محصولات فعال دارای مجوز</span>
              <strong>{workspace.products.length.toLocaleString("fa-IR")}</strong>
            </article>
          </section>

          <section className="workspace-panel workspace-info-panel">
            <h2>اطلاعات سازمان</h2>
            <dl className="workspace-info-list">
              <div><dt>شناسه عمومی</dt><dd>{workspace.slug}</dd></div>
              <div><dt>وضعیت</dt><dd>{workspace.status === "ACTIVE" ? "فعال" : workspace.status}</dd></div>
              <div><dt>تاریخ ایجاد</dt><dd>{new Date(workspace.createdAt).toLocaleDateString("fa-IR")}</dd></div>
            </dl>
          </section>

          <section className="workspace-list">
            <div className="workspace-list-heading">
              <h2>محصولات دارای مجوز</h2>
              <span className="workspace-muted">فقط مجوزهای معتبر نمایش داده می‌شوند.</span>
            </div>
            {workspace.products.length === 0 ? (
              <div className="workspace-empty">
                <strong>هنوز محصولی برای این سازمان فعال نشده است.</strong>
                <p>پس از ایجاد و تأیید مجوز محصول، دسترسی آن در همین بخش نمایش داده می‌شود.</p>
              </div>
            ) : (
              <div className="workspace-cards">
                {workspace.products.map(product => (
                  <article className="workspace-card" key={product.licenseId}>
                    <div>
                      <span className="workspace-kicker">{product.key}</span>
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                    </div>
                    <div className="workspace-meta">
                      <span>{product.status === "ACTIVE" ? "آماده استفاده" : product.status}</span>
                      {product.baseUrl && product.status === "ACTIVE" && (
                        <a href={product.baseUrl} target="_blank" rel="noreferrer">ورود به محصول</a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
      <p className="workspace-footnote">VAYRO CORE · دسترسی محدود به اعضای مجاز همین سازمان</p>
    </main>
  );
}
