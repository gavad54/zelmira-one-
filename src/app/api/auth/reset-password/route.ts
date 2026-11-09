import { z } from "zod";
import { AuthTokenPurpose } from "@prisma/client";
import { hashPassword,isSameOriginRequest } from "@/lib/auth-core.mjs";
import { allowIpAttempt,allowAttempt,noStoreJson,requestFingerprint,sha256 } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
export const runtime="nodejs";
export async function POST(request:Request){
  await assertAuthRuntimeRole();
 if(!isSameOriginRequest(request))return noStoreJson({error:"invalid_origin"},403);
 const p=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password:z.string().min(12).max(128)}).strict().safeParse(await request.json().catch(()=>null));
 if(!p.success)return noStoreJson({error:"invalid_input"},400);
 const limits=await Promise.all([allowIpAttempt("reset-password-ip",10,3600000),allowAttempt(await requestFingerprint("reset-password-token",sha256(p.data.token)),5,900000)]);
 if(limits.some(x=>!x))return noStoreJson({error:"try_again_later"},429);
 const passwordHash=await hashPassword(p.data.password);
 try{
  const ok=await authPrisma.$transaction(async tx=>{
   const t=await tx.authActionToken.findUnique({where:{tokenHash:sha256(p.data.token)}});
   if(!t||t.purpose!==AuthTokenPurpose.PASSWORD_RESET||t.consumedAt||t.expiresAt<=new Date())return false;
   const used=await tx.authActionToken.updateMany({where:{id:t.id,consumedAt:null,expiresAt:{gt:new Date()}},data:{consumedAt:new Date()}});
   if(used.count!==1)return false;
   await tx.user.update({where:{id:t.userId},data:{passwordHash}});
   await tx.session.deleteMany({where:{userId:t.userId}});
   await tx.auditEvent.create({data:{actorUserId:t.userId,action:"auth.password_reset",resource:"User",resourceId:t.userId}, select: { id: true }});
   return true;
  });
  return ok?noStoreJson({reset:true}):noStoreJson({error:"invalid_or_expired_token"},400);
 }catch{return noStoreJson({error:"password_reset_failed"},500);}
}
