import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authorizeOwnerSession } from "@/lib/owner-session.mjs";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";

export async function requireOwnerPage(nextPath = "/command-center") {
  await assertAuthRuntimeRole();
  const sessionToken = (await cookies()).get("vayro_session")?.value;
  const result = await authorizeOwnerSession({ sessionToken, db: authPrisma });
  if (!result.authorized) redirect("/login?next=" + encodeURIComponent(nextPath));
}
