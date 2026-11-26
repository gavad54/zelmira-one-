"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Conversation = {
  id: string;
  title: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SearchResult = {
  id: string;
  conversationId: string;
  title: string | null;
  role: string;
  createdAt: string;
  snippet: string;
};

export default function ConversationsClient() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const router = useRouter();
  const [rows, setRows] = useState<Conversation[]>([]);
  const [archived, setArchived] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const base = `/api/tenants/${encodeURIComponent(tenantId)}/conversations`;
  const pageUrl = `/workspaces/${encodeURIComponent(tenantId)}/conversations`;

  const load = useCallback(async (nextCursor: string | null = null, append = false) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "25", archived: archived ? "1" : "0" });
      if (nextCursor) params.set("cursor", nextCursor);
      const response = await fetch(`${base}?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error("دریافت فهرست گفتگوها ممکن نشد.");
      setRows(current => append ? [...current, ...data.conversations] : data.conversations);
      setCursor(data.nextCursor ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "خطا در دریافت گفتگوها.");
    } finally {
      setLoading(false);
    }
  }, [archived, base]);

  useEffect(() => { void load(); }, [load]);

  async function createConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      const data = await response.json();
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error("ساخت گفتگوی جدید انجام نشد.");
      router.push(`${pageUrl}/${encodeURIComponent(data.conversation.id)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "خطا در ساخت گفتگو.");
    } finally {
      setBusy(false);
    }
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 2) {
      setError("عبارت جستجو باید دست‌کم ۲ نویسه باشد.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${base}/search?q=${encodeURIComponent(query.trim())}&limit=20&archived=${archived ? "1" : "0"}`, { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error("جستجوی گفتگوها انجام نشد.");
      setResults(data.results ?? []);
      setSearched(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "خطا در جستجو.");
    } finally {
      setBusy(false);
    }
  }

  async function setArchive(conversationId: string, nextArchived: boolean) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${base}/${encodeURIComponent(conversationId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: nextArchived })
      });
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error("تغییر وضعیت بایگانی انجام نشد.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "خطا در تغییر بایگانی.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-shell" dir="rtl" style={{ paddingBottom: 56 }}>
      <header className="topbar">
        <Link href="/" className="brand"><strong>VAYRO</strong><small>CONVERSATION ARCHIVE</small></Link>
        <Link href={`/workspaces/${encodeURIComponent(tenantId)}`} className="secondary-action">بازگشت به سازمان</Link>
      </header>

      <section className="section" style={{ paddingTop: 38 }}>
        <div className="section-heading">
          <div><span className="eyebrow">VAYRO · WORKSPACE</span><h2>گفتگوها و بایگانی</h2></div>
          <p>گفتگوها در محدودهٔ سازمان شما نگهداری می‌شوند و دسترسی آن‌ها با عضویت و مجوز سمت سرور کنترل می‌شود.</p>
        </div>

        <form onSubmit={createConversation} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <input value={title} onChange={event => setTitle(event.target.value)} maxLength={200} placeholder="عنوان گفتگوی جدید (اختیاری)" aria-label="عنوان گفتگوی جدید" style={fieldStyle} />
          <button className="primary-action" type="submit" disabled={busy}>گفتگوی جدید</button>
        </form>

        <form onSubmit={search} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <input value={query} onChange={event => setQuery(event.target.value)} maxLength={200} placeholder="جستجو در متن گفتگوها..." aria-label="جستجو در گفتگوها" style={fieldStyle} />
          <button className="secondary-action" type="submit" disabled={busy}>جستجو</button>
          {searched && <button className="secondary-action" type="button" onClick={() => { setSearched(false); setResults([]); }}>پاک‌کردن نتیجه</button>}
        </form>

        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          <button className={archived ? "secondary-action" : "primary-action"} type="button" onClick={() => { setArchived(false); setSearched(false); }}>گفتگوهای فعال</button>
          <button className={archived ? "primary-action" : "secondary-action"} type="button" onClick={() => { setArchived(true); setSearched(false); }}>بایگانی‌شده‌ها</button>
        </div>

        {error && <p role="alert" style={{ color: "#ffb4a9" }}>{error}</p>}

        {searched ? (
          <div style={{ display: "grid", gap: 10 }}>
            {results.length === 0 ? <p style={mutedStyle}>نتیجه‌ای پیدا نشد.</p> : results.map(item => (
              <Link key={item.id} href={`${pageUrl}/${encodeURIComponent(item.conversationId)}`} className="product-card" style={{ minHeight: 0 }}>
                <strong>{item.title || "گفتگوی بدون عنوان"}</strong>
                <span style={mutedStyle}>{new Date(item.createdAt).toLocaleString("fa-IR")}</span>
                <p>{item.snippet}</p>
              </Link>
            ))}
          </div>
        ) : loading ? (
          <p role="status" style={mutedStyle}>در حال بارگذاری گفتگوها...</p>
        ) : rows.length === 0 ? (
          <p style={mutedStyle}>{archived ? "هنوز گفتگوی بایگانی‌شده‌ای وجود ندارد." : "هنوز گفتگویی ساخته نشده است."}</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {rows.map(item => (
              <article key={item.id} className="product-card" style={{ minHeight: 0, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <Link href={`${pageUrl}/${encodeURIComponent(item.id)}`} style={{ flex: "1 1 220px" }}>
                  <strong>{item.title || "گفتگوی بدون عنوان"}</strong>
                  <span style={{ ...mutedStyle, display: "block", marginTop: 8 }}>آخرین تغییر: {new Date(item.updatedAt).toLocaleString("fa-IR")}</span>
                </Link>
                <button className="secondary-action" type="button" disabled={busy} onClick={() => void setArchive(item.id, !archived)}>
                  {archived ? "بازگردانی" : "بایگانی"}
                </button>
              </article>
            ))}
          </div>
        )}
        {!searched && cursor && <button className="secondary-action" type="button" disabled={loading} onClick={() => void load(cursor, true)} style={{ marginTop: 16 }}>گفتگوهای بیشتر</button>}
      </section>
    </main>
  );
}

const fieldStyle = {
  flex: "1 1 240px",
  minWidth: 0,
  minHeight: 46,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid var(--line-strong)",
  color: "var(--text)",
  background: "var(--panel)"
} as const;

const mutedStyle = { color: "var(--muted)", fontSize: 12, lineHeight: 2 } as const;
