import { Prisma,PlatformRole,EmailPurpose } from "@prisma/client";
import { z } from "zod";
import { hashPassword,isSameOriginRequest } from "@/lib/auth-core.mjs";
import { allowAttempt,issueSession,noStoreJson,requestFingerprint,safeEqualText } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return noStoreJson({error:"invalid_origin"},403);
 const p=z.object({bootstrapToken:z.string().min(32).max(512),email:z.string().trim().email().max(254),displayName:z.string().trim().min(2).max(80),password:z.string().min(12).max(128)}).strict().safeParse(await request.json().catch(()=>null));
 if(!p.success)return noStoreJson({error:"invalid_input"},400);
 const expected=process.env.VAYRO_OWNER_BOOTSTRAP_TOKEN;
 if(!expected||expected.length<32||!safeEqualText(p.data.bootstrapToken,expected))return noStoreJson({error:"bootstrap_unavailable"},403);
 if(!await allowAttempt(await requestFingerprint("owner-bootstrap","initial"),3,3600000))return noStoreJson({error:"try_again_later"},429);
 try{
  const email=p.data.email.toLowerCase(),passwordHash=await hashPassword(p.data.password);
  const user=await prisma.$transaction(async tx=>{
   const exists=await tx.user.count({where:{platformRole:{in:[PlatformRole.OWNER,PlatformRole.PLATFORM_ADMIN]}}});
   if(exists>0)throw new Error("BOOTSTRAP_ALREADY_USED");
   const created=await tx.user.create({data:{email,displayName:p.data.displayName,passwordHash,platformRole:PlatformRole.OWNER,emailVerifiedAt:new Date()}});
   await tx.emailContact.create({data:{email,label:"ایمیل اولیه مالک",purposes:[EmailPurpose.OWNER],enabled:true}});
   await tx.auditEvent.create({data:{actorUserId:created.id,action:"owner.bootstrap_completed",resource:"User",resourceId:created.id,metadata:{method:"one_time_deployment_secret"}}});
   return created;
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  await issueSession(user.id);
  return noStoreJson({created:true,authenticated:true,user:{id:user.id,email:user.email,displayName:user.displayName,platformRole:user.platformRole}},201);
 }catch(e){if(e instanceof Error&&e.message==="BOOTSTRAP_ALREADY_USED")return noStoreJson({error:"bootstrap_already_used"},409);return noStoreJson({error:"bootstrap_failed"},500);}
}
