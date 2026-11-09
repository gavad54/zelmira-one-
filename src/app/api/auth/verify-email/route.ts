import { AuthTokenPurpose } from "@prisma/client";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { noStoreJson,sha256 } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
export const runtime="nodejs";
export async function POST(request:Request){
  await assertAuthRuntimeRole();
 if(!isSameOriginRequest(request))return noStoreJson({error:"invalid_origin"},403);
 const b=await request.json().catch(()=>null) as {token?:unknown}|null;
 if(!b||typeof b.token!=="string"||!/^[a-f0-9]{64}$/.test(b.token))return noStoreJson({error:"invalid_or_expired_token"},400);
 try{
  const ok=await authPrisma.$transaction(async tx=>{
   const t=await tx.authActionToken.findUnique({where:{tokenHash:sha256(b.token as string)}});
   if(!t||t.purpose!==AuthTokenPurpose.EMAIL_VERIFY||t.consumedAt||t.expiresAt<=new Date())return false;
   const used=await tx.authActionToken.updateMany({where:{id:t.id,consumedAt:null,expiresAt:{gt:new Date()}},data:{consumedAt:new Date()}});
   if(used.count!==1)return false;
   await tx.user.update({where:{id:t.userId},data:{emailVerifiedAt:new Date()}});
   await tx.auditEvent.create({data:{actorUserId:t.userId,action:"auth.email_verified",resource:"User",resourceId:t.userId}, select: { id: true }});
   return true;
  });
  return ok?noStoreJson({verified:true}):noStoreJson({error:"invalid_or_expired_token"},400);
 }catch{return noStoreJson({error:"verification_failed"},500);}
}
