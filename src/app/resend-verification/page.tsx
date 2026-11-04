"use client";
import {FormEvent,useState} from "react";
export default function ResendVerificationPage(){
 const [email,setEmail]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);try{await fetch("/api/auth/resend-verification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});setMessage("اگر حساب تأییدنشده‌ای با این ایمیل وجود داشته باشد، پیوند تازه ارسال می‌شود.");}catch{setMessage("درخواست ثبت نشد؛ بعداً دوباره تلاش کنید.");}finally{setBusy(false);}}
 return <main className="auth-page" dir="rtl"><section className="auth-panel"><span>VAYRO</span><h1>ارسال دوباره پیوند تأیید</h1><form onSubmit={submit}><label>ایمیل حساب<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><button disabled={busy}>{busy?"در حال ارسال...":"ارسال پیوند تأیید"}</button></form><p role="status">{message}</p><a href="/login">بازگشت به ورود</a></section></main>;
}
