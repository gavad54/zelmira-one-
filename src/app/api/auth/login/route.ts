import { z } from "zod";
import { isSameOriginRequest,verifyPassword } from "@/lib/auth-core.mjs";
import { allowAttempt,issueSession,noStoreJson,requestFingerprint } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return noStoreJson({error:"invalid_origin"},403);
 const p=z.object({email:z.string().trim().email().max(254),password:z.string().min(1).max(128)}).strict().safeParse(await request.json().catch(()=>null));
 if(!p.success)return noStoreJson({error:"invalid_credentials"},400);
 const email=p.data.email.toLowerCase();
 const limits=await Promise.all([allowAttempt(await requestFingerprint("login-ip","all"),8,900000),allowAttempt(await requestFingerprint("login-email",email),8,900000)]);
 if(limits.some(x=>!x))return noStoreJson({error:"try_again_later"},429);
 const user=await prisma.user.findUnique({where:{email}});
 const valid=user?await verifyPassword(p.data.password,user.passwordHash):false;
 if(!user||!valid||user.disabledAt)return noStoreJson({error:"invalid_credentials"},401);
 if(!user.emailVerifiedAt)return noStoreJson({error:"invalid_credentials"},401);
 await issueSession(user.id);
 await prisma.auditEvent.create({data:{actorUserId:user.id,action:"auth.login",resource:"User",resourceId:user.id}});
 return noStoreJson({authenticated:true,user:{id:user.id,email:user.email,displayName:user.displayName,platformRole:user.platformRole}});
}
