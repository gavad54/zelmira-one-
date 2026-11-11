"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback,useEffect,useState } from "react";
type Item={id:string;key:string;name:string;description:string;status:string;baseUrl:string|null;licensed:boolean;license:{id:string;startsAt:string;endsAt:string|null;active:boolean}|null;access:boolean;accessReason:string;launchUrl:string|null};
const reasons:Record<string,string>={active:"دارای مجوز معتبر",no_license:"بدون مجوز",license_inactive:"مجوز لغوشده",not_started:"شروع مجوز در آینده",expired:"مجوز منقضی‌شده",product_unavailable:"محصول در حال حاضر قابل استفاده نیست",invalid_license:"اطلاعات مجوز نامعتبر"};
export default function TenantProductsPage(){
 const {tenantId}=useParams<{tenantId:string}>();
 const [items,setItems]=useState<Item[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[role,setRole]=useState("");
 const load=useCallback(async()=>{setLoading(true);setError("");try{const r=await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/products`,{cache:"no-store"});const d=await r.json();if(r.status===401){window.location.assign("/login");return;}if(r.status===403)throw new Error("شما به این سازمان دسترسی ندارید.");if(!r.ok)throw new Error("دریافت محصولات سازمان ممکن نشد.");setItems(d.products||[]);setRole(d.role||"");}catch(e){setError(e instanceof Error?e.message:"خطای ارتباط با سرور.");}finally{setLoading(false);}},[tenantId]);
 useEffect(()=>{void load();},[load]);
 return <main className="vayro-console" dir="rtl"><header className="console-heading"><span className="eyebrow">VAYRO · TENANT PRODUCT ACCESS</span><h1>محصولات سازمان</h1><p>نمایش کاتالوگ و مجوزهای معتبر همین سازمان. دسترسی هر محصول در سرور و پایگاه داده کنترل می‌شود.</p></header>
 <div className="command-section-title"><Link href={`/workspaces/${encodeURIComponent(tenantId)}`}>بازگشت به فضای کاری ←</Link><button className="lab-refresh" onClick={()=>void load()}>به‌روزرسانی</button></div>
 {role&&<p className="workspace-muted">نقش شما: {role}</p>}{error&&<p className="owner-error" role="alert">{error}</p>}
 {loading?<p>در حال دریافت محصولات…</p>:<div className="portfolio-grid">{items.map(item=><article className="portfolio-card" key={item.id}><div className="portfolio-card-top"><span>{item.key}</span><small>{item.access?"دسترسی مجاز":"دسترسی محدود"}</small></div><h2>{item.name}</h2><p>{item.description}</p><div className="portfolio-card-status">{reasons[item.accessReason]||item.accessReason}</div>{item.license&&<p>اعتبار: {new Date(item.license.startsAt).toLocaleDateString("fa-IR")} تا {item.license.endsAt?new Date(item.license.endsAt).toLocaleDateString("fa-IR"):"نامحدود"}</p>}{item.access&&item.launchUrl&&<a className="secondary-action" href={item.launchUrl} target="_blank" rel="noreferrer">ورود به محصول ←</a>}</article>)}</div>}
 <p className="console-footnote">عدم نمایش پیوند ورود به محصول به‌معنای نبود مجوز معتبر، غیرفعال‌بودن محصول یا نبود نشانی امن تأییدشده است.</p></main>;
}
