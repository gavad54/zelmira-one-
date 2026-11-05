"use client";
import Link from "next/link";
import {FormEvent,useState} from "react";
export default function ResendVerificationPage(){
 const [email,setEmail]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/auth/resend-verification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
   if(!response.ok)throw new Error();
   setMessage("اگر حسابی با این نشانی نیازمند تأیید باشد، پیوند تازه ارسال می‌شود.");
  }catch{setMessage("درخواست انجام نشد؛ کمی بعد دوباره تلاش کنید.");}
  finally{setBusy(false);}
 }
 return <main className="auth-page" dir="rtl"><section className="auth-panel"><span>VAYRO</span><h1>ارسال دوباره پیوند تأیید</h1><form onSubmit={submit}><label>ایمیل حساب<input type="email" required maxLength={254} autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)}/></label><button disabled={busy}>{busy?"در حال ارسال...":"ارسال پیوند تازه"}</button></form><p role="status">{message}</p><Link href="/login">بازگشت به ورود</Link></section></main>;
}
