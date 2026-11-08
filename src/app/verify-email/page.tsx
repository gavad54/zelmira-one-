"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
export default function VerifyEmailPage(){
 const [token,setToken]=useState<string|null>(null);
 const [message,setMessage]=useState("پیوند را بازبینی کنید و برای تأیید دکمه را بزنید.");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  const value=new URLSearchParams(window.location.hash.slice(1)).get("token");
  window.history.replaceState({},"","/verify-email");
  if(value&&/^[a-f0-9]{64}$/.test(value))setToken(value);
  else setMessage("پیوند تأیید وجود ندارد یا نامعتبر است.");
 },[]);
 async function confirm(){
  if(!token)return;
  setBusy(true);
  try{
   const response=await fetch("/api/auth/verify-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});
   if(!response.ok)throw new Error();
   setToken(null);setMessage("ایمیل حساب شما تأیید شد. اکنون می‌توانید وارد شوید.");
  }catch{setMessage("پیوند تأیید نامعتبر یا منقضی شده است.");}
  finally{setBusy(false);}
 }
 return <main className="auth-page" dir="rtl"><section className="auth-panel"><span>VAYRO</span><h1>تأیید ایمیل</h1><p role="status">{message}</p>{token&&<button type="button" disabled={busy} onClick={()=>void confirm()}>{busy?"در حال تأیید...":"تأیید نشانی ایمیل"}</button>}<Link href="/login">رفتن به ورود</Link></section></main>;
}
