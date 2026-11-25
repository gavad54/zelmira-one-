import { cookies } from "next/headers";
import { noStoreJson } from "@/lib/auth-service";
import { withPlatformOwnerTransaction } from "@/lib/platform-request-transaction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function sessionToken() {
  return (await cookies()).get("vayro_session")?.value;
}

export async function GET() {
  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async tx => {
        const goals = await tx.goalRecord.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true, goalKey: true, projectKey: true, title: true, version: true,
            status: true, priority: true, approvalRequired: true, scheduledAt: true,
            deadline: true, createdAt: true, updatedAt: true,
            epics: {
              orderBy: { sortOrder: "asc" },
              select: {
                id: true, epicKey: true, title: true, status: true, sortOrder: true,
                features: {
                  orderBy: { sortOrder: "asc" },
                  select: {
                    id: true, featureKey: true, title: true, acceptanceCriteria: true,
                    handlerKey: true, status: true, sortOrder: true,
                    task: {
                      select: {
                        id: true, status: true, attemptCount: true, lastErrorCode: true,
                        reviews: {
                          orderBy: { reviewRound: "desc" },
                          take: 3,
                          select: {
                            reviewRound: true, decision: true, evidence: true, createdAt: true,
                            reviewer: { select: { agentKey: true, displayName: true, version: true } }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
        return goals;
      }
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    return noStoreJson({ goals: result.value });
  } catch {
    return noStoreJson({ error: "goal_read_failed" }, 503);
  }
}
