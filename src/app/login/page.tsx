"use client";
import Link from "next/link";
import {FormEvent,useState} from "react";
export default function LoginPage(){
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMessage("");try{const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok)throw new Error(d.error==="try_again_later"?"تعداد تلاش‌ها زیاد است؛ بعداً دوباره امتحان کنید.":"ورود انجام نشد. ایمیل و رمز را بررسی کنید؛ اگر حساب تازه ساخته‌اید، ایمیل را تأیید کنید.");location.assign("/");}catch(e){setMessage(e instanceof Error?e.message:"ورود انجام نشد.");}finally{setBusy(false);}}
 return <main className="auth-page" dir="rtl"><section className="auth-panel"><span>VAYRO</span><h1>ورود به حساب</h1><form onSubmit={submit}><label>ایمیل<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>رمز عبور<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy}>{busy?"در حال ورود...":"ورود"}</button></form><p role="alert">{message}</p><Link href="/register">ساخت حساب</Link> · <Link href="/resend-verification">ارسال دوباره تأیید</Link> · <Link href="/forgot-password">فراموشی رمز</Link></section></main>;
}
