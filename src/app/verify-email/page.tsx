"use client";
import {useEffect,useState} from "react";
export default function VerifyEmailPage(){
 const [message,setMessage]=useState("در حال بررسی پیوند تأیید...");
 useEffect(()=>{const token=new URLSearchParams(location.hash.slice(1)).get("token");history.replaceState({},"","/verify-email");if(!token){setMessage("پیوند تأیید وجود ندارد یا نامعتبر است.");return;}fetch("/api/auth/verify-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})}).then(async r=>{if(!r.ok)throw new Error();setMessage("ایمیل حساب شما تأیید شد. اکنون می‌توانید وارد شوید.");}).catch(()=>setMessage("پیوند تأیید نامعتبر یا منقضی شده است."));},[]);
 return <main className="auth-page" dir="rtl"><section className="auth-panel"><span>VAYRO</span><h1>تأیید ایمیل</h1><p role="status">{message}</p><a href="/login">رفتن به ورود</a></section></main>;
}
