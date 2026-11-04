"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
type Contact = { id: string; email: string; label: string; purposes: string[]; enabled: boolean; isPrimary: boolean; verifiedAt: string | null };
const purposes = [["OWNER","مدیریت مالک"],["SUPPORT","پشتیبانی"],["BILLING","مالی و اشتراک"],["SECURITY","امنیت"],["GENERAL","ارتباط عمومی"]] as const;
export default function EmailSettings({ verificationToken }: { verificationToken: string | null }) {
  const [contacts,setContacts] = useState<Contact[]>([]);
  const [email,setEmail] = useState(""); const [label,setLabel] = useState("");
  const [selected,setSelected] = useState<string[]>(["OWNER"]);
  const [loading,setLoading] = useState(true); const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState(""); const [error,setError] = useState("");
  const [pendingToken,setPendingToken] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/owner/email-contacts",{cache:"no-store"});
      if (!response.ok) throw new Error(response.status===401 ? "برای مدیریت ایمیل‌ها ابتدا باید با حساب مالک وارد شوید." : "دریافت فهرست ایمیل‌ها ناموفق بود.");
      const data = await response.json(); setContacts(data.contacts); setError("");
    } catch(err) { setError(err instanceof Error ? err.message : "خطای نامشخص"); }
    finally { setLoading(false); }
  },[]);
  useEffect(() => {
    const fragmentToken = verificationToken ?? new URLSearchParams(window.location.hash.slice(1)).get("verify");
    if (fragmentToken) {
      setPendingToken(fragmentToken);
      window.history.replaceState({}, "", "/owner/email-settings");
    }
    void load();
  },[verificationToken,load]);
  async function confirmVerification() {
    if (!pendingToken) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/owner/email-contacts/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: pendingToken })
      });
      if (!response.ok) throw new Error("پیوند تأیید نامعتبر یا منقضی شده است.");
      setPendingToken(null);
      setNotice("نشانی ایمیل با موفقیت تأیید شد.");
      await load();
    } catch(err) {
      setError(err instanceof Error ? err.message : "تأیید ایمیل ناموفق بود.");
    } finally { setBusy(false); }
  }
  async function addContact(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const response=await fetch("/api/owner/email-contacts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,label,purposes:selected})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error==="email_already_exists"?"این ایمیل قبلاً ثبت شده است.":"ثبت ایمیل انجام نشد.");
      setEmail("");setLabel("");setSelected(["OWNER"]);setNotice("ایمیل اضافه شد؛ برای فعال شدن باید مالکیت آن تأیید شود.");await load();
    } catch(err){setError(err instanceof Error?err.message:"خطای نامشخص");} finally{setBusy(false);}
  }
  async function updateContact(contact:Contact,patch:Record<string,unknown>) {
    setBusy(true);setError("");
    try {
      const response=await fetch("/api/owner/email-contacts/"+contact.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(patch)});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error==="primary_contact_must_be_enabled_and_verified"?"ابتدا ایمیل را تأیید کنید.":data.error==="last_verified_owner_contact_cannot_be_disabled_or_reassigned"?"ابتدا ایمیل جایگزین مالک را اضافه و تأیید کنید.":"تغییرات ذخیره نشد.");
      await load();
    } catch(err){setError(err instanceof Error?err.message:"خطای نامشخص");} finally{setBusy(false);}
  }
  async function verifyContact(contact:Contact) {
    setBusy(true);setError("");setNotice("");
    try {
      const response=await fetch("/api/owner/email-contacts/"+contact.id+"/verify",{method:"POST"});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error==="email_service_not_configured_or_delivery_failed"?"سرویس ارسال ایمیل هنوز پیکربندی نشده است.":"ارسال پیوند تأیید ناموفق بود.");
      setNotice("پیوند تأیید برای این ایمیل ارسال شد.");
    } catch(err){setError(err instanceof Error?err.message:"خطای نامشخص");} finally{setBusy(false);}
  }
  async function removeContact(contact:Contact) {
    if(!window.confirm("ایمیل "+contact.email+" حذف شود؟")) return;
    setBusy(true);setError("");
    try {
      const response=await fetch("/api/owner/email-contacts/"+contact.id,{method:"DELETE"});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error==="last_verified_owner_contact_cannot_be_deleted"?"آخرین ایمیل تأییدشده مالک قابل حذف نیست؛ ابتدا ایمیل جایگزین اضافه و تأیید کنید.":"حذف ایمیل انجام نشد.");
      await load();
    } catch(err){setError(err instanceof Error?err.message:"خطای نامشخص");} finally{setBusy(false);}
  }
  return <main className="email-admin">
    <header className="email-admin-header"><Link href="/" className="email-back">← بازگشت به وایرو</Link><span className="email-kicker">VAYRO CONTROL CENTER</span><h1>مدیریت ایمیل‌ها</h1><p>افزودن، تأیید، دسته‌بندی و حذف ایمیل‌های مدیریتی و ارتباطی.</p></header>
    {notice&&<div className="email-notice" role="status">{notice}</div>}{pendingToken&&<div className="email-notice" role="group"><p>برای تکمیل تأیید، دکمه زیر را انتخاب کنید.</p><button type="button" disabled={busy} onClick={()=>void confirmVerification()}>تأیید نشانی ایمیل</button></div>}{error&&<div className="email-error" role="alert">{error}</div>}
    <section className="email-panel"><h2>افزودن ایمیل جدید</h2><form onSubmit={addContact} className="email-form">
      <label>نشانی ایمیل<input type="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" dir="ltr"/></label>
      <label>عنوان یا نام گیرنده<input required minLength={2} maxLength={60} value={label} onChange={e=>setLabel(e.target.value)} placeholder="مثلاً ایمیل مدیریت"/></label>
      <fieldset><legend>کاربرد ایمیل</legend>{purposes.map(([value,title])=><label className="email-check" key={value}><input type="checkbox" checked={selected.includes(value)} onChange={e=>setSelected(old=>e.target.checked?[...old,value]:old.filter(x=>x!==value))}/>{title}</label>)}</fieldset>
      <button disabled={busy||selected.length===0} type="submit">{busy?"در حال انجام...":"افزودن ایمیل"}</button>
    </form></section>
    <section className="email-panel"><h2>فهرست ایمیل‌ها</h2>
      {loading?<p>در حال بارگذاری...</p>:contacts.length===0?<p>هنوز ایمیلی ثبت نشده است.</p>:contacts.map(contact=><article className="email-contact" key={contact.id}>
        <div className="email-contact-main"><strong dir="ltr">{contact.email}</strong><span>{contact.label}</span><small>{contact.purposes.map(p=>purposes.find(x=>x[0]===p)?.[1]??p).join("، ")}</small><small>{contact.verifiedAt?"تأییدشده":"تأییدنشده"} · {contact.enabled?"فعال":"غیرفعال"}{contact.isPrimary?" · ایمیل اصلی":""}</small></div>
        <div className="email-contact-actions">
          {!contact.verifiedAt&&<button type="button" disabled={busy||!contact.enabled} onClick={()=>void verifyContact(contact)}>ارسال تأیید</button>}
          {contact.verifiedAt&&!contact.isPrimary&&<button type="button" disabled={busy} onClick={()=>void updateContact(contact,{isPrimary:true})}>انتخاب اصلی</button>}
          <button type="button" className="email-secondary" disabled={busy} onClick={()=>void updateContact(contact,{enabled:!contact.enabled})}>{contact.enabled?"غیرفعال‌سازی":"فعال‌سازی"}</button>
          <button type="button" className="email-danger" disabled={busy} onClick={()=>void removeContact(contact)}>حذف</button>
        </div>
      </article>)}
    </section>
    <p className="email-footnote">نشانی فرستنده خودکار از تنظیمات امن سرویس ایمیل تعیین می‌شود و با ایمیل‌های دریافت‌کننده تفاوت دارد. رمزها و کلیدهای سرویس در این صفحه وارد نمی‌شوند.</p>
  </main>;
}
