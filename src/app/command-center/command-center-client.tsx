"use client";
import Link from "next/link";
import { useCallback,useEffect,useState } from "react";
type Product={id:string;key:string;name:string;description:string;status:string;baseUrl:string|null;licenseCount:number};
type Metrics={totalProducts:number;totalTenants:number;activeLicenses:number;allLicenses:number};
const areas=[
{title:"مدیریت محصولات",desc:"وضعیت و نشانی امن یازده محصول",href:"/owner",label:"مدیریت کاتالوگ"},
{title:"مجوز و اشتراک",desc:"صدور، لغو و پیگیری مجوزهای سازمان‌ها",href:"/owner/licenses",label:"مدیریت مجوزها"},
{title:"کاربران و سازمان‌ها",desc:"فضاهای کاری و عضویت‌ها",href:"/workspaces",label:"فضاهای کاری"},
{title:"هوش مصنوعی DANA",desc:"دستیار و هماهنگی هوشمند در محدوده مجوزها",href:"/dana/ai-workspace",label:"ورود به دانا"},
{title:"آزمایشگاه توسعه و آینده",desc:"ثبت پیشنهاد، ارزیابی، تصمیم مالک و پیگیری",href:"/future-lab",label:"ورود به آزمایشگاه"},
{title:"ایمیل و ارتباطات",desc:"مدیریت نشانی‌های رسمی و تأییدشده",href:"/owner/email-settings",label:"تنظیمات ایمیل"},
{title:"رشد و قابلیت‌ها",desc:"راهکارهای رشد و قابلیت‌های هوشمند موجود",href:"/growth",label:"مشاهده راهکارها"}
];
export default function CommandCenterPage(){
 const [products,setProducts]=useState<Product[]>([]),[metrics,setMetrics]=useState<Metrics|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const load=useCallback(async()=>{setLoading(true);setError("");try{const r=await fetch("/api/owner/products",{cache:"no-store"});const d=await r.json();if(r.status===401){window.location.assign("/login");return;}if(!r.ok)throw new Error("داده‌های مرکز فرماندهی در دسترس نیست.");setProducts(d.products||[]);setMetrics(d.metrics||null);}catch(e){setError(e instanceof Error?e.message:"خطای ارتباط با سرور.");}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();},[load]);
 return <main className="vayro-console" dir="rtl">
 <header className="console-heading"><span className="eyebrow">VAYRO · OWNER COMMAND CENTER</span><h1>مرکز فرماندهی وایرو</h1><p>کنترل مالکانه و ممیزی‌پذیر اکوسیستم. این داشبورد فقط با نشست مالک تأییدشده و MFA قابل مشاهده است.</p></header>
 {error&&<p className="owner-error" role="alert">{error} <button onClick={()=>void load()}>تلاش دوباره</button></p>}
 <section className="command-metrics">{[["محصولات در کاتالوگ",metrics?metrics.totalProducts+" / 11":"—"],["سازمان‌ها",metrics?String(metrics.totalTenants):"—"],["مجوزهای فعال",metrics?String(metrics.activeLicenses):"—"],["کل مجوزها",metrics?String(metrics.allLicenses):"—"]].map(([label,value])=><article key={label}><span>{label}</span><strong>{loading?"…":value}</strong></article>)}</section>
 <section className="command-section"><div className="command-section-title"><div><span className="eyebrow">CONTROL DOMAINS</span><h2>بخش‌های مدیریتی</h2></div><span className="live-label">دسترسی مالک</span></div>
 <div className="command-grid">{areas.map((a,i)=><article className="command-card" key={a.href}><span className="command-index">{String(i+1).padStart(2,"0")}</span><h3>{a.title}</h3><p>{a.desc}</p><Link href={a.href}>{a.label} ←</Link></article>)}</div></section>
 <section className="command-section"><div className="command-section-title"><div><span className="eyebrow">PORTFOLIO STATUS</span><h2>نمای وضعیت محصولات</h2></div><Link href="/products">فهرست کامل ←</Link></div>
 {loading?<p>در حال دریافت وضعیت امن محصولات…</p>:<div className="command-product-list">{products.map(p=><div key={p.id}><strong>{p.name}</strong><span>{p.description}</span><small>{p.status==="ACTIVE"?"فعال در کاتالوگ":p.status==="MAINTENANCE"?"در حال نگهداری":p.status==="RETIRED"?"بازنشسته":"در برنامه"}</small></div>)}</div>}</section>
 <p className="console-footnote">شاخص‌ها از API مالک خوانده می‌شوند. «فعال» در کاتالوگ به‌تنهایی اثبات‌کننده آمادگی انتشار یا فروش نیست. سلامت زیرساخت، امنیت و پشتیبان‌گیری باید جداگانه تأیید شوند.</p>
 </main>;
}
