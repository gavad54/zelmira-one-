import { z } from "zod";
import { AuthTokenPurpose } from "@prisma/client";
import { hashPassword,isSameOriginRequest } from "@/lib/auth-core.mjs";
import { allowIpAttempt,allowAttempt,actionUrl,createActionToken,noStoreJson,requestFingerprint,sendActionEmail } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
export const runtime="nodejs";
export async function POST(request:Request){
  await assertAuthRuntimeRole();
 if(!isSameOriginRequest(request)) return noStoreJson({error:"invalid_origin"},403);
 const p=z.object({email:z.string().trim().email().max(254),displayName:z.string().trim().min(2).max(80),password:z.string().min(12).max(128)}).strict().safeParse(await request.json().catch(()=>null));
 if(!p.success) return noStoreJson({error:"invalid_input"},400);
 const platformOwnerCount=await authPrisma.user.count({where:{platformRole:{in:["OWNER","PLATFORM_ADMIN"]}}});
 if(platformOwnerCount===0)return noStoreJson({error:"owner_setup_required"},503);
 const email=p.data.email.toLowerCase();
 const limits=await Promise.all([allowIpAttempt("register-ip",10,3600000),allowAttempt(await requestFingerprint("register-email",email),4,3600000)]);
 if(limits.some(x=>!x)) return noStoreJson({error:"try_again_later"},429);
 try{
  const user=await authPrisma.user.create({data:{email,displayName:p.data.displayName,passwordHash:await hashPassword(p.data.password)}});
  const token=await createActionToken(user.id,AuthTokenPurpose.EMAIL_VERIFY,86400000);
  await authPrisma.auditEvent.create({data:{actorUserId:user.id,action:"auth.registered",resource:"User",resourceId:user.id}, select: { id: true }});
  try{await sendActionEmail(email,"تأیید ایمیل وایرو",actionUrl("/verify-email",token),"برای فعال‌سازی حساب، ایمیل خود را تأیید کنید. اعتبار پیوند ۲۴ ساعت است.");return noStoreJson({accepted:true},202);}
  catch{return noStoreJson({accepted:true},202);}
 }catch(e){if(typeof e==="object"&&e!==null&&"code" in e&&e.code==="P2002")return noStoreJson({accepted:true},202);return noStoreJson({error:"registration_failed"},500);}
}
