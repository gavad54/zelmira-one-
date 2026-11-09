"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

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
  const [renameName, setRenameName] = useState("");
  const [managementBusy, setManagementBusy] = useState(false);
  const [managementError, setManagementError] = useState("");
  const [managementNotice, setManagementNotice] = useState("");

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
      setRenameName(data.tenant.name);
      setRole(data.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { void load(); }, [load]);

  async function renameWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManagementBusy(true);
    setManagementError("");
    setManagementNotice("");
    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameName })
      });
      const data = await response.json();
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) {
        const messages: Record<string, string> = {
          invalid_input: "نام سازمان باید بین ۲ تا ۱۰۰ نویسه باشد.",
          try_again_later: "تعداد درخواست‌ها زیاد است؛ بعداً دوباره تلاش کنید.",
          tenant_not_found: "سازمان فعال پیدا نشد."
        };
        throw new Error(messages[data.error] || "تغییر نام سازمان انجام نشد.");
      }
      setWorkspace(current => current ? { ...current, name: data.tenant.name } : current);
      setRenameName(data.tenant.name);
      setManagementNotice("نام سازمان با موفقیت تغییر کرد.");
    } catch (err) {
      setManagementError(err instanceof Error ? err.message : "خطا در تغییر نام سازمان.");
    } finally {
      setManagementBusy(false);
    }
  }

  async function closeWorkspace() {
    const confirmed = window.confirm(
      "سازمان بسته می‌شود و اعضا دیگر به فضای کاری دسترسی نخواهند داشت. اطلاعات حذف نمی‌شود. ادامه می‌دهید؟"
    );
    if (!confirmed) return;

    setManagementBusy(true);
    setManagementError("");
    setManagementNotice("");
    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) {
        throw new Error(data.error === "try_again_later"
          ? "تعداد درخواست‌ها زیاد است؛ بعداً دوباره تلاش کنید."
          : "بستن سازمان انجام نشد.");
      }
      window.location.assign("/workspaces");
    } catch (err) {
      setManagementError(err instanceof Error ? err.message : "خطا در بستن سازمان.");
    } finally {
      setManagementBusy(false);
    }
  }

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


          {(role === "OWNER" || role === "ADMIN") && (
            <section className="workspace-panel workspace-management-panel">
              <h2>مدیریت سازمان</h2>
              <form className="workspace-form" onSubmit={renameWorkspace}>
                <label htmlFor="workspace-rename">تغییر نام سازمان</label>
                <div className="workspace-form-row">
                  <input
                    id="workspace-rename"
                    value={renameName}
                    onChange={event => setRenameName(event.target.value)}
                    minLength={2}
                    maxLength={100}
                    required
                    aria-describedby="workspace-management-help"
                  />
                  <button type="submit" disabled={managementBusy || renameName.trim().length < 2}>
                    {managementBusy ? "در حال ذخیره..." : "ذخیره نام"}
                  </button>
                </div>
                <p id="workspace-management-help" className="workspace-muted">
                  مالک و مدیر سازمان می‌توانند نام آن را تغییر دهند.
                </p>
              </form>
              {role === "OWNER" && (
                <div className="workspace-danger-zone">
                  <div>
                    <strong>بستن سازمان</strong>
                    <p>فقط مالک می‌تواند سازمان را ببندد. اطلاعات حذف نمی‌شود، اما دسترسی اعضا متوقف خواهد شد.</p>
                  </div>
                  <button type="button" className="workspace-danger-button" disabled={managementBusy} onClick={() => void closeWorkspace()}>
                    بستن سازمان
                  </button>
                </div>
              )}
              {managementNotice && <p className="workspace-notice" role="status">{managementNotice}</p>}
              {managementError && <p className="workspace-error" role="alert">{managementError}</p>}
            </section>
          )}

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
