import { cookies } from "next/headers";
import { isSameOriginRequest,hashSessionToken } from "@/lib/auth-core.mjs";
import { clearSessionCookie,noStoreJson } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return noStoreJson({error:"invalid_origin"},403);
 const token=(await cookies()).get("vayro_session")?.value;
 if(token&&/^[a-f0-9]{64}$/.test(token)){
  const s=await prisma.session.findUnique({where:{tokenHash:hashSessionToken(token)},select:{id:true,userId:true}});
  if(s){await prisma.session.delete({where:{id:s.id}});await prisma.auditEvent.create({data:{actorUserId:s.userId,action:"auth.logout",resource:"Session",resourceId:s.id}});}
 }
 await clearSessionCookie();return noStoreJson({authenticated:false});
}
