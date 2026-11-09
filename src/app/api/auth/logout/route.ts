import { cookies } from "next/headers";
import { isSameOriginRequest,hashSessionToken } from "@/lib/auth-core.mjs";
import { clearSessionCookie,noStoreJson } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
export const runtime="nodejs";
export async function POST(request:Request){
  await assertAuthRuntimeRole();
 if(!isSameOriginRequest(request))return noStoreJson({error:"invalid_origin"},403);
 const token=(await cookies()).get("vayro_session")?.value;
 if(token&&/^[a-f0-9]{64}$/.test(token)){
  const s=await authPrisma.session.findUnique({where:{tokenHash:hashSessionToken(token)},select:{id:true,userId:true}});
  if(s){await authPrisma.session.delete({where:{id:s.id}});await authPrisma.auditEvent.create({data:{actorUserId:s.userId,action:"auth.logout",resource:"Session",resourceId:s.id}, select: { id: true }});}
 }
 await clearSessionCookie();return noStoreJson({authenticated:false});
}
