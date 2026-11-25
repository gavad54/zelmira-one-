-- Additive persistence for the VAYRO goal hierarchy, recurring schedules,
-- governed agent registry and independent task reviews.
-- This migration is branch-scoped and must be applied only to disposable/test DBs
-- until live schema reconciliation, encrypted backup and isolated restore are approved.

CREATE TABLE public."GoalRecord" (
  "id" TEXT NOT NULL,
  "goalKey" VARCHAR(100) NOT NULL,
  "projectKey" VARCHAR(40) NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(24) NOT NULL DEFAULT 'PLANNED',
  "priority" INTEGER NOT NULL DEFAULT 50,
  "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
  "scheduledAt" TIMESTAMP(3),
  "deadline" TIMESTAMP(3),
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GoalRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GoalRecord_goalKey_version_key" UNIQUE ("goalKey","version"),
  CONSTRAINT "GoalRecord_version_check" CHECK ("version" BETWEEN 1 AND 1000000),
  CONSTRAINT "GoalRecord_priority_check" CHECK ("priority" BETWEEN 0 AND 100),
  CONSTRAINT "GoalRecord_dates_check" CHECK ("deadline" IS NULL OR "scheduledAt" IS NULL OR "deadline" > "scheduledAt")
);
CREATE INDEX "GoalRecord_projectKey_status_createdAt_idx" ON public."GoalRecord" ("projectKey","status","createdAt");

CREATE TABLE public."GoalEpic" (
  "id" TEXT NOT NULL,
  "goalId" TEXT NOT NULL,
  "epicKey" VARCHAR(100) NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "status" VARCHAR(24) NOT NULL DEFAULT 'PLANNED',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GoalEpic_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GoalEpic_goalId_epicKey_key" UNIQUE ("goalId","epicKey"),
  CONSTRAINT "GoalEpic_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES public."GoalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "GoalEpic_goalId_sortOrder_idx" ON public."GoalEpic" ("goalId","sortOrder");

CREATE TABLE public."GoalFeature" (
  "id" TEXT NOT NULL,
  "epicId" TEXT NOT NULL,
  "featureKey" VARCHAR(100) NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "acceptanceCriteria" VARCHAR(500) NOT NULL,
  "handlerKey" VARCHAR(80) NOT NULL,
  "status" VARCHAR(24) NOT NULL DEFAULT 'PLANNED',
  "taskId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GoalFeature_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GoalFeature_epicId_featureKey_key" UNIQUE ("epicId","featureKey"),
  CONSTRAINT "GoalFeature_taskId_key" UNIQUE ("taskId"),
  CONSTRAINT "GoalFeature_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES public."GoalEpic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GoalFeature_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."EngineeringTask"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "GoalFeature_handlerKey_check" CHECK ("handlerKey" IN ('report.generate','repo.audit','repo.test'))
);
CREATE INDEX "GoalFeature_epicId_sortOrder_idx" ON public."GoalFeature" ("epicId","sortOrder");
CREATE INDEX "GoalFeature_status_idx" ON public."GoalFeature" ("status");

CREATE TABLE public."RecurringSchedule" (
  "id" TEXT NOT NULL,
  "scheduleKey" VARCHAR(100) NOT NULL,
  "projectKey" VARCHAR(40) NOT NULL,
  "handlerKey" VARCHAR(80) NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "payload" JSONB,
  "interval" INTEGER NOT NULL,
  "unit" VARCHAR(12) NOT NULL,
  "missedRunPolicy" VARCHAR(20) NOT NULL DEFAULT 'SKIP',
  "startAt" TIMESTAMP(3) NOT NULL,
  "nextRunAt" TIMESTAMP(3) NOT NULL,
  "lastRunAt" TIMESTAMP(3),
  "endAt" TIMESTAMP(3),
  "maxRuns" INTEGER,
  "runCount" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecurringSchedule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RecurringSchedule_scheduleKey_key" UNIQUE ("scheduleKey"),
  CONSTRAINT "RecurringSchedule_interval_check" CHECK ("interval" BETWEEN 1 AND 10000),
  CONSTRAINT "RecurringSchedule_unit_check" CHECK ("unit" IN ('MINUTES','HOURS','DAYS','WEEKS')),
  CONSTRAINT "RecurringSchedule_handler_check" CHECK ("handlerKey" IN ('report.generate','repo.audit','repo.test')),
  CONSTRAINT "RecurringSchedule_missed_policy_check" CHECK ("missedRunPolicy" IN ('SKIP','CATCH_UP_ONCE')),
  CONSTRAINT "RecurringSchedule_runs_check" CHECK ("runCount" >= 0 AND ("maxRuns" IS NULL OR "maxRuns" BETWEEN 1 AND 100000)),
  CONSTRAINT "RecurringSchedule_dates_check" CHECK ("endAt" IS NULL OR "endAt" > "startAt")
);
CREATE INDEX "RecurringSchedule_enabled_nextRunAt_idx" ON public."RecurringSchedule" ("enabled","nextRunAt");
CREATE INDEX "RecurringSchedule_projectKey_enabled_idx" ON public."RecurringSchedule" ("projectKey","enabled");

CREATE TABLE public."EngineeringAgent" (
  "id" TEXT NOT NULL,
  "agentKey" VARCHAR(64) NOT NULL,
  "version" INTEGER NOT NULL,
  "displayName" VARCHAR(100) NOT NULL,
  "capabilities" JSONB NOT NULL,
  "permissions" JSONB NOT NULL,
  "projectKeys" JSONB NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EngineeringAgent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EngineeringAgent_agentKey_key" UNIQUE ("agentKey"),
  CONSTRAINT "EngineeringAgent_version_check" CHECK ("version" >= 1)
);

CREATE TABLE public."TaskReview" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "executorAgentKey" VARCHAR(64) NOT NULL,
  "reviewerAgentId" TEXT NOT NULL,
  "reviewRound" INTEGER NOT NULL DEFAULT 1,
  "decision" VARCHAR(24) NOT NULL,
  "evidence" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TaskReview_taskId_reviewRound_key" UNIQUE ("taskId","reviewRound"),
  CONSTRAINT "TaskReview_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."EngineeringTask"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TaskReview_reviewerAgentId_fkey" FOREIGN KEY ("reviewerAgentId") REFERENCES public."EngineeringAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TaskReview_reviewRound_check" CHECK ("reviewRound" >= 1),
  CONSTRAINT "TaskReview_decision_check" CHECK ("decision" IN ('APPROVE','REQUEST_CHANGES','BLOCK'))
);
CREATE INDEX "TaskReview_reviewerAgentId_createdAt_idx" ON public."TaskReview" ("reviewerAgentId","createdAt");
CREATE INDEX "TaskReview_decision_createdAt_idx" ON public."TaskReview" ("decision","createdAt");

-- These are owner/control-plane records, never exposed to tenant application roles.
ALTER TABLE public."GoalRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GoalEpic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GoalFeature" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RecurringSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EngineeringAgent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TaskReview" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."GoalRecord", public."GoalEpic", public."GoalFeature",
  public."RecurringSchedule", public."EngineeringAgent", public."TaskReview"
  FROM PUBLIC, anon, authenticated, service_role, vayro_app, vayro_auth,
       vayro_platform, vayro_platform_bootstrap, vayro_task_worker;

-- No direct table grants are introduced here. Owner-only access must be added
-- through reviewed SECURITY DEFINER APIs after verifying the platform actor
-- and least-privilege role boundaries on the target database.
