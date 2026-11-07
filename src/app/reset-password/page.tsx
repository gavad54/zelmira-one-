"use client";
import Link from "next/link";
import {FormEvent,useState} from "react";
export default function ResetPasswordPage(){
 const [password,setPassword]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();const token=new URLSearchParams(location.hash.slice(1)).get("token");history.replaceState({},"","/reset-password");if(!token){setMessage("پیوند بازیابی نامعتبر است.");return;}setBusy(true);try{const r=await fetch("/api/auth/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,password})});if(!r.ok)throw new Error();setMessage("رمز عبور تغییر کرد. همه نشست‌های قبلی باطل شدند.");}catch{setMessage("پیوند منقضی یا نامعتبر است، یا رمز عبور شرایط لازم را ندارد.");}finally{setBusy(false);}}
 return <main className="auth-page" dir="rtl"><section className="auth-panel"><span>VAYRO</span><h1>تنظیم رمز تازه</h1><form onSubmit={submit}><label>رمز تازه<input type="password" minLength={12} maxLength={128} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy}>{busy?"در حال ذخیره...":"ذخیره رمز تازه"}</button></form><p role="status">{message}</p><Link href="/login">بازگشت به ورود</Link></section></main>;
}
