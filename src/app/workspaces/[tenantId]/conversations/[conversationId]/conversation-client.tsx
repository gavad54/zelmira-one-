"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Attachment = { id: string; fileName: string; contentType: string; byteSize: number; sha256: string; createdAt: string };
type Message = {
  id: string;
  role: string;
  content: string;
  contentSha256: string;
  createdAt: string;
  senderUserId: string | null;
  attachments: Attachment[];
};

export default function ConversationClient() {
  const { tenantId, conversationId } = useParams<{ tenantId: string; conversationId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const base = `/api/tenants/${encodeURIComponent(tenantId)}/conversations/${encodeURIComponent(conversationId)}`;
  const listUrl = `/workspaces/${encodeURIComponent(tenantId)}/conversations`;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${base}/messages?limit=50`, { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error("دریافت پیام‌ها ممکن نشد.");
      setMessages((data.messages ?? []).reverse());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "خطا در دریافت گفتگو.");
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => { void load(); }, [load]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${base}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      const data = await response.json();
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error(data.error === "conversation_not_found_or_archived" ? "این گفتگو بایگانی شده یا در دسترس نیست." : "ارسال پیام انجام نشد.");
      setMessages(current => [...current, data.message]);
      setContent("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "خطا در ارسال پیام.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-shell" dir="rtl" style={{ paddingBottom: 56 }}>
      <header className="topbar">
        <Link href="/" className="brand"><strong>VAYRO</strong><small>CONVERSATION</small></Link>
        <Link href={listUrl} className="secondary-action">بازگشت به گفتگوها</Link>
      </header>
      <section className="section" style={{ paddingTop: 38 }}>
        <div className="section-heading">
          <div><span className="eyebrow">VAYRO · PRIVATE WORKSPACE</span><h2>گفتگو</h2></div>
          <a className="secondary-action" href={`${base}/export`}>خروجی JSON</a>
        </div>
        {error && <p role="alert" style={{ color: "#ffb4a9" }}>{error}</p>}
        {loading ? <p role="status" style={mutedStyle}>در حال دریافت پیام‌ها...</p> : (
          <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
            {messages.length === 0 ? <p style={mutedStyle}>هنوز پیامی در این گفتگو ثبت نشده است.</p> : messages.map(message => (
              <article key={message.id} className="product-card" style={{ minHeight: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <strong>{message.role === "USER" ? "شما" : message.role === "ASSISTANT" ? "دستیار" : message.role}</strong>
                  <span style={mutedStyle}>{new Date(message.createdAt).toLocaleString("fa-IR")}</span>
                </div>
                <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 2 }}>{message.content}</p>
                {message.attachments.length > 0 && <small style={mutedStyle}>پیوست‌های ثبت‌شده: {message.attachments.length.toLocaleString("fa-IR")} (دریافت فایل هنوز فعال نشده است)</small>}
              </article>
            ))}
          </div>
        )}
        <form onSubmit={send} style={{ display: "grid", gap: 10 }}>
          <textarea value={content} onChange={event => setContent(event.target.value)} maxLength={24000} rows={5} placeholder="پیام خود را بنویسید..." aria-label="متن پیام" style={textareaStyle} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="primary-action" type="submit" disabled={busy || !content.trim()}>ارسال پیام</button>
            <button className="secondary-action" type="button" disabled={loading || busy} onClick={() => void load()}>بارگذاری دوباره</button>
          </div>
        </form>
        <p style={{ ...mutedStyle, marginTop: 16 }}>بارگذاری و دریافت فایل تا زمان اتصال و آزمون مخزن خصوصی فایل فعال نیست.</p>
      </section>
    </main>
  );
}

const textareaStyle = {
  width: "100%",
  minHeight: 120,
  padding: 14,
  borderRadius: 12,
  border: "1px solid var(--line-strong)",
  color: "var(--text)",
  background: "var(--panel)",
  font: "inherit",
  resize: "vertical"
} as const;
const mutedStyle = { color: "var(--muted)", fontSize: 12, lineHeight: 2 } as const;
