"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import "./creative-brief.css";

const formats = [
  ["instagram-post","پست اینستاگرام"],["instagram-story","استوری"],["youtube-thumbnail","تامبنیل یوتیوب"],
  ["product-photo","عکس محصول"],["ad-banner","بنر تبلیغاتی"],["logo-concept","مفهوم لوگو"],["brand-kit","کیت هویت بصری"]
] as const;
type State = {project:string;format:string;audience:string;message:string;style:string;brandColors:string;requiredElements:string;avoid:string};
const initial:State={project:"",format:"instagram-post",audience:"",message:"",style:"مدرن، حرفه‌ای و مینیمال",brandColors:"",requiredElements:"",avoid:""};

export default function NegahCreativeBriefPage(){
 const [form,setForm]=useState<State>(initial),[brief,setBrief]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[copied,setCopied]=useState(false);
 const update=(key:keyof State,value:string)=>setForm(old=>({...old,[key]:value}));
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");setBrief("");setCopied(false);try{
  const response=await fetch("/api/negah/creative-brief",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
  const data=await response.json();if(response.status===401){window.location.assign("/login");return;}if(!response.ok)throw new Error("اطلاعات ورودی را بررسی کنید.");
  setBrief(data.brief);
 }catch(err){setError(err instanceof Error?err.message:"ساخت بریف انجام نشد.");}finally{setBusy(false);}}
 async function copy(){try{await navigator.clipboard.writeText(brief);setCopied(true);}catch{setError("کپی خودکار در دسترس نیست؛ متن را انتخاب و کپی کنید.");}}
 return <main className="page-shell negah-page" dir="rtl">
  <header className="topbar"><Link className="brand" href="/"><span className="brand-mark">V</span><span><strong>وایرو</strong><small>VAYRO · NEGAH</small></span></Link><Link className="secondary-action" href="/ai-business-suite">فهرست قابلیت‌ها</Link></header>
  <section className="negah-hero"><span className="eyebrow">NEGAH · CREATIVE BRIEF WORKSPACE</span><h1>بریف حرفه‌ای تولید محتوای بصری</h1><p>نیاز پروژه را تعریف کنید تا مشخصات اجرایی، جهت هنری، حقوق دارایی‌ها و معیارهای کنترل کیفیت آماده شود.</p><div className="negah-notice">این ابزار بریف تولید می‌کند؛ در این نسخه تصویر یا فایل گرافیکی رندر نمی‌شود و اتصال سرویس تصویر هنوز فعال نیست.</div></section>
  <section className="negah-layout"><form className="negah-form" onSubmit={submit}>
   <label>نام و شرح پروژه<input required minLength={2} maxLength={1000} value={form.project} onChange={e=>update("project",e.target.value)} placeholder="مثلاً کمپین معرفی محصول جدید"/></label>
   <label>نوع خروجی<select value={form.format} onChange={e=>update("format",e.target.value)}>{formats.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
   <label>مخاطب هدف<input required minLength={2} maxLength={1000} value={form.audience} onChange={e=>update("audience",e.target.value)} placeholder="مخاطبان و ویژگی نیاز آن‌ها"/></label>
   <label>پیام اصلی<textarea required minLength={2} maxLength={1000} rows={3} value={form.message} onChange={e=>update("message",e.target.value)}/></label>
   <label>سبک بصری<input required minLength={2} maxLength={1000} value={form.style} onChange={e=>update("style",e.target.value)}/></label>
   <label>رنگ‌های برند<input maxLength={1200} value={form.brandColors} onChange={e=>update("brandColors",e.target.value)} placeholder="مثلاً سرمه‌ای، طلایی و آبی یخی"/></label>
   <label>عناصر ضروری<textarea rows={2} maxLength={1200} value={form.requiredElements} onChange={e=>update("requiredElements",e.target.value)}/></label>
   <label>مواردی که نباید استفاده شوند<textarea rows={2} maxLength={1200} value={form.avoid} onChange={e=>update("avoid",e.target.value)}/></label>
   <button type="submit" disabled={busy}>{busy?"در حال آماده‌سازی...":"تولید بریف خلاقیت"}</button>
  </form><aside className="negah-output"><div><h2>بریف اجرایی پروژه</h2>{brief&&<button type="button" onClick={copy}>{copied?"کپی شد":"کپی بریف"}</button>}</div>{brief?<pre>{brief}</pre>:<p>پس از تکمیل فرم، بریف ساختاریافته در این بخش قرار می‌گیرد.</p>}{error&&<p role="alert">{error}</p>}</aside></section>
  <footer className="footer"><span>© {new Date().getFullYear()} VAYRO</span><span>NEGAH CREATIVE STUDIO</span></footer>
 </main>;
}
