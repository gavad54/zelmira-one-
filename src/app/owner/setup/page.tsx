"use client";
import {FormEvent,useState} from "react";
export default function OwnerSetupPage(){
 const [bootstrapToken,setBootstrapToken]=useState("");
 const [email,setEmail]=useState("");
 const [displayName,setDisplayName]=useState("");
 const [password,setPassword]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/owner/bootstrap",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({bootstrapToken,email,displayName,password})});
   const data=await response.json();
   if(!response.ok){
    const errors:Record<string,string>={bootstrap_unavailable:"راه‌اندازی اولیه مجاز نیست؛ کلید یک‌بارمصرف در تنظیمات امن سرور وجود ندارد یا معتبر نیست.",bootstrap_already_used:"حساب مالک قبلاً ساخته شده است.",try_again_later:"تعداد تلاش‌ها زیاد است؛ بعداً دوباره تلاش کنید."};
    throw new Error(errors[data.error]??"ساخت حساب مالک انجام نشد. تنظیمات سرور را بررسی کنید.");
   }
   setBootstrapToken("");setPassword("");
   setMessage("حساب مالک ایجاد شد و نشست امن برقرار شد. اکنون وارد پنل مدیریت ایمیل شوید.");
   window.location.assign("/owner/email-settings");
  }catch(error){setMessage(error instanceof Error?error.message:"راه‌اندازی انجام نشد.");}
  finally{setBusy(false);}
 }
 return <main className="auth-page" dir="rtl"><section className="auth-panel"><span>VAYRO CONTROL CENTER</span><h1>راه‌اندازی اولیه مالک</h1><p>این صفحه فقط با کلید یک‌بارمصرفی که مدیر مجاز در تنظیمات محرمانه سرور قرار می‌دهد کار می‌کند. کلید را در گفتگو یا مخزن کد وارد نکنید.</p><form onSubmit={submit}>
 <label>کلید یک‌بارمصرف راه‌اندازی<input type="password" required minLength={32} maxLength={512} autoComplete="off" value={bootstrapToken} onChange={e=>setBootstrapToken(e.target.value)}/></label>
 <label>ایمیل حساب مالک<input type="email" required maxLength={254} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
 <label>نام نمایشی<input required minLength={2} maxLength={80} value={displayName} onChange={e=>setDisplayName(e.target.value)}/></label>
 <label>رمز عبور (حداقل ۱۲ نویسه)<input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
 <button disabled={busy}>{busy?"در حال راه‌اندازی...":"ایجاد حساب مالک"}</button>
 </form><p role="status">{message}</p><a href="/">بازگشت به صفحه اصلی</a></section></main>;
}
