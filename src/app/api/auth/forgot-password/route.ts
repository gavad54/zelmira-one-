import { z } from "zod";
import { AuthTokenPurpose } from "@prisma/client";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { allowIpAttempt,allowAttempt,actionUrl,createActionToken,noStoreJson,requestFingerprint,sendActionEmail } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
export const runtime="nodejs";
export async function POST(request:Request){
  await assertAuthRuntimeRole();
 if(!isSameOriginRequest(request))return noStoreJson({error:"invalid_origin"},403);
 const p=z.object({email:z.string().trim().email().max(254)}).safeParse(await request.json().catch(()=>null));
 if(!p.success)return noStoreJson({error:"invalid_input"},400);
 const email=p.data.email.toLowerCase();
 const limits=await Promise.all([allowAttempt(await requestFingerprint("forgot-password",email),3,3600000),allowIpAttempt("forgot-password-ip",10,3600000)]);
 if(limits.some(x=>!x))return noStoreJson({accepted:true},202);
 const u=await authPrisma.user.findUnique({where:{email}});
 if(u&&u.emailVerifiedAt&&!u.disabledAt){try{const token=await createActionToken(u.id,AuthTokenPurpose.PASSWORD_RESET,1800000);await sendActionEmail(email,"بازیابی رمز وایرو",actionUrl("/reset-password",token),"درخواست بازیابی رمز ثبت شده است. اعتبار پیوند ۳۰ دقیقه است.");}catch{/* Generic response avoids account enumeration. */}}
 return noStoreJson({accepted:true},202);
}
