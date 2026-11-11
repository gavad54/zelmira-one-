"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Tenant = { id: string; name: string; slug: string };
type Product = { id: string; key: string; name: string };
type License = {
  id: string; tenantId: string; productId: string; startsAt: string; endsAt: string | null; active: boolean;
  createdAt: string; tenant: { name: string; slug: string; status: string };
  product: { key: string; name: string; status: string };
};
export default function OwnerLicensesClient() {
  const [tenants,setTenants]=useState<Tenant[]>([]);
  const [products,setProducts]=useState<Product[]>([]);
  const [licenses,setLicenses]=useState<License[]>([]);
  const [tenantId,setTenantId]=useState("");
  const [productId,setProductId]=useState("");
  const [endsAt,setEndsAt]=useState("");
  const [busy,setBusy]=useState("");
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const load=useCallback(async()=>{
    setError("");
    try {
      const r=await fetch("/api/owner/licenses",{cache:"no-store"});
      const d=await r.json();
      if(r.status===401){window.location.assign("/login");return;}
      if(!r.ok)throw new Error("دریافت اطلاعات مجوزها ناموفق بود.");
      setTenants(d.tenants||[]);setProducts(d.products||[]);setLicenses(d.licenses||[]);
      if(!tenantId&&d.tenants?.[0])setTenantId(d.tenants[0].id);
      if(!productId&&d.products?.[0])setProductId(d.products[0].id);
    } catch(e){setError(e instanceof Error?e.message:"خطای دریافت اطلاعات.");}
  },[tenantId,productId]);
  useEffect(()=>{void load();},[load]);
  async function issue(e:React.FormEvent){
    e.preventDefault();setBusy("issue");setError("");setNotice("");
    try{
      const r=await fetch("/api/owner/licenses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tenantId,productId,...(endsAt?{endsAt:new Date(endsAt).toISOString()}: {})})});
      const d=await r.json();
      if(r.status===401){window.location.assign("/login");return;}
      const messages:Record<string,string>={license_already_exists:"برای این سازمان و محصول قبلاً مجوز ثبت شده است.",product_not_sellable:"محصول باید ابتدا در کاتالوگ فعال شود.",tenant_unavailable:"سازمان فعال نیست.",invalid_date_range:"تاریخ پایان باید پس از شروع باشد."};
      if(!r.ok)throw new Error(messages[d.error]||"صدور مجوز انجام نشد.");
      setNotice("مجوز صادر شد و در گزارش ممیزی ثبت گردید.");setEndsAt("");await load();
    }catch(e){setError(e instanceof Error?e.message:"صدور مجوز ناموفق بود.");}finally{setBusy("");}
  }
  async function change(license:License,active:boolean){
    setBusy(license.id);setError("");setNotice("");
    try{
      const r=await fetch("/api/owner/licenses",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({licenseId:license.id,active})});
      const d=await r.json();if(r.status===401){window.location.assign("/login");return;}
      if(!r.ok)throw new Error("تغییر وضعیت مجوز انجام نشد.");
      setNotice(active?"مجوز دوباره فعال شد.":"مجوز لغو شد.");await load();
    }catch(e){setError(e instanceof Error?e.message:"خطای تغییر مجوز.");}finally{setBusy("");}
  }
  return <main className="vayro-console" dir="rtl">
    <header className="console-heading"><span className="eyebrow">VAYRO · LICENSE CONTROL</span><h1>مدیریت مجوز و اشتراک</h1><p>صدور، مشاهده، لغو و فعال‌سازی دوباره مجوز محصولات. این عملیات فقط توسط مالک دارای نشست MFA انجام می‌شود.</p></header>
    <div className="lab-governance"><strong>شفافیت تجاری</strong><p>این بخش مدیریت مجوز است، نه درگاه پرداخت. صدور مجوز دستی به‌معنای دریافت وجه نیست؛ اتصال پرداخت و تطبیق مالی باید جداگانه پیاده‌سازی و تأیید شود.</p></div>
    {notice&&<p className="owner-notice" role="status">{notice}</p>}{error&&<p className="owner-error" role="alert">{error}</p>}
    <form className="lab-form license-form" onSubmit={issue}><span className="eyebrow">ISSUE LICENSE</span><h2>صدور مجوز محصول</h2>
      <label>سازمان<select required value={tenantId} onChange={e=>setTenantId(e.target.value)}><option value="">انتخاب سازمان</option>{tenants.map(t=><option key={t.id} value={t.id}>{t.name} · {t.slug}</option>)}</select></label>
      <label>محصول فعال<select required value={productId} onChange={e=>setProductId(e.target.value)}><option value="">انتخاب محصول</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.key}</option>)}</select></label>
      <label>تاریخ پایان (اختیاری)<input type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)}/></label>
      <button disabled={!!busy||!tenantId||!productId||!products.length||!tenants.length}>{busy==="issue"?"در حال صدور…":"صدور مجوز"}</button>
      {!tenants.length&&<p className="workspace-muted">سازمان فعالی برای صدور مجوز وجود ندارد.</p>}
      {!products.length&&<p className="workspace-muted">محصول فعالی برای صدور مجوز وجود ندارد.</p>}
    </form>
    <section className="command-section"><div className="command-section-title"><div><span className="eyebrow">LICENSE LEDGER</span><h2>دفتر مجوزها</h2></div><button className="lab-refresh" onClick={()=>void load()}>به‌روزرسانی</button></div>
      {!licenses.length?<p className="workspace-muted">هنوز مجوزی ثبت نشده است.</p>:<div className="lab-proposals">{licenses.map(l=><article key={l.id}><div className="lab-proposal-heading"><strong>{l.product.name} · {l.tenant.name}</strong><small>{l.active?"فعال":"لغوشده"}</small></div><div className="lab-meta"><span>شروع: {new Date(l.startsAt).toLocaleDateString("fa-IR")}</span><span>پایان: {l.endsAt?new Date(l.endsAt).toLocaleDateString("fa-IR"):"بدون تاریخ پایان"}</span><span>ثبت: {new Date(l.createdAt).toLocaleDateString("fa-IR")}</span></div><div className="lab-actions"><button disabled={!!busy||l.active} onClick={()=>void change(l,true)}>فعال‌سازی دوباره</button><button disabled={!!busy||!l.active} onClick={()=>void change(l,false)}>لغو مجوز</button></div></article>)}</div>}
    </section>
    <p className="console-footnote">هر تغییر مجوز در AuditEvent ثبت می‌شود. سوابق مالی، صورتحساب و تراکنش بانکی در این نسخه ایجاد یا جعل نمی‌شوند.</p>
  </main>;
}
