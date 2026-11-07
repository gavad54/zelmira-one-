import { currentSession,noStoreJson } from "@/lib/auth-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){const s=await currentSession();return s?noStoreJson({authenticated:true,user:s.user}):noStoreJson({authenticated:false},401);}
