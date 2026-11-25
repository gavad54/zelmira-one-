-- Dedicated least-privilege role and durable recurring schedule materializer.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vayro_task_scheduler') THEN
    CREATE ROLE vayro_task_scheduler NOLOGIN NOINHERIT;
  END IF;
END
$$;
ALTER ROLE vayro_task_scheduler INHERIT;
GRANT USAGE ON SCHEMA public TO vayro_task_scheduler;

CREATE OR REPLACE FUNCTION public.vayro_materialize_due_engineering_schedules(
  p_scheduler_id TEXT,
  p_batch_size INTEGER DEFAULT 10
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE
  v_schedule public."RecurringSchedule"%ROWTYPE;
  v_now TIMESTAMP(3) := timezone('UTC', clock_timestamp())::TIMESTAMP(3);
  v_interval_ms BIGINT;
  v_elapsed_ms BIGINT;
  v_occurrence TIMESTAMP(3);
  v_latest_due TIMESTAMP(3);
  v_next TIMESTAMP(3);
  v_task_type TEXT;
  v_task_id TEXT;
  v_created INTEGER := 0;
  v_run_count INTEGER;
  v_enabled BOOLEAN;
BEGIN
  IF p_scheduler_id IS NULL OR p_scheduler_id !~ '^[A-Za-z0-9._:-]{3,100}$' THEN
    RAISE EXCEPTION 'SCHEDULER_ID_INVALID' USING ERRCODE = '22023';
  END IF;
  IF p_batch_size IS NULL OR p_batch_size < 1 OR p_batch_size > 100 THEN
    RAISE EXCEPTION 'SCHEDULER_BATCH_SIZE_INVALID' USING ERRCODE = '22023';
  END IF;

  FOR v_schedule IN
    SELECT * FROM public."RecurringSchedule"
    WHERE "enabled" = true AND "nextRunAt" <= v_now
    ORDER BY "nextRunAt", "createdAt"
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  LOOP
    v_interval_ms := v_schedule."interval"::BIGINT * CASE v_schedule."unit"
      WHEN 'MINUTES' THEN 60000
      WHEN 'HOURS' THEN 3600000
      WHEN 'DAYS' THEN 86400000
      WHEN 'WEEKS' THEN 604800000
      ELSE NULL
    END;
    IF v_interval_ms IS NULL OR v_interval_ms < 1 OR v_interval_ms > 31622400000 THEN
      RAISE EXCEPTION 'SCHEDULE_INTERVAL_INVALID' USING ERRCODE = '22023';
    END IF;

    v_elapsed_ms := floor(extract(epoch FROM (v_now - v_schedule."nextRunAt")) * 1000)::BIGINT;
    v_latest_due := v_schedule."nextRunAt" + make_interval(secs => (floor(v_elapsed_ms::NUMERIC / v_interval_ms) * v_interval_ms / 1000)::DOUBLE PRECISION);
    IF v_schedule."missedRunPolicy" = 'CATCH_UP_ONCE' THEN
      v_occurrence := v_schedule."nextRunAt";
    ELSE
      v_occurrence := v_latest_due;
    END IF;

    IF v_schedule."endAt" IS NOT NULL AND v_occurrence > v_schedule."endAt" THEN
      UPDATE public."RecurringSchedule" SET "enabled" = false, "updatedAt" = v_now WHERE "id" = v_schedule."id";
      CONTINUE;
    END IF;

    v_task_type := CASE WHEN v_schedule."handlerKey" = 'report.generate' THEN 'REPORTING' ELSE 'ENGINEERING' END;
    v_task_id := gen_random_uuid()::TEXT;
    INSERT INTO public."EngineeringTask" (
      "id","projectKey","taskType","handlerKey","title","priority","status","payload",
      "idempotencyKey","scheduledAt","availableAt","maxAttempts","attemptCount",
      "approvalRequired","createdAt","updatedAt"
    ) VALUES (
      v_task_id,v_schedule."projectKey",v_task_type,v_schedule."handlerKey",v_schedule."title",50,'QUEUED',
      COALESCE(v_schedule."payload",'{}'::JSONB) || jsonb_build_object(
        'scheduleKey',v_schedule."scheduleKey",
        'scheduledFor',to_char(v_occurrence,'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      ),
      'schedule:' || v_schedule."scheduleKey" || ':' || to_char(v_occurrence AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      v_occurrence,v_now,3,0,false,v_now,v_now
    )
    ON CONFLICT ("idempotencyKey") DO NOTHING;
    GET DIAGNOSTICS v_run_count = ROW_COUNT;
    v_created := v_created + v_run_count;

    -- Both policies advance beyond the backlog; CATCH_UP_ONCE emits only the oldest missed run.
    v_next := v_latest_due + make_interval(secs => (v_interval_ms / 1000)::DOUBLE PRECISION);
    UPDATE public."RecurringSchedule"
    SET "lastRunAt" = v_occurrence,
        "nextRunAt" = v_next,
        "runCount" = "runCount" + 1,
        "enabled" = (
          ("maxRuns" IS NULL OR "runCount" + 1 < "maxRuns")
          AND ("endAt" IS NULL OR v_next <= "endAt")
        ),
        "updatedAt" = v_now
    WHERE "id" = v_schedule."id";
  END LOOP;

  RETURN v_created;
END;
$$;

REVOKE ALL ON FUNCTION public.vayro_materialize_due_engineering_schedules(TEXT,INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vayro_materialize_due_engineering_schedules(TEXT,INTEGER) TO vayro_task_scheduler;


-- Reconcile durable goal/epic/feature status from authoritative task states.
-- This is a read-derived projection update; it does not dispatch or approve work.
CREATE OR REPLACE FUNCTION public.vayro_reconcile_goal_progress(p_batch_size INTEGER DEFAULT 100)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE
  v_updated INTEGER := 0;
  v_count INTEGER;
BEGIN
  IF p_batch_size IS NULL OR p_batch_size < 1 OR p_batch_size > 1000 THEN
    RAISE EXCEPTION 'GOAL_RECONCILE_BATCH_INVALID' USING ERRCODE = '22023';
  END IF;

  WITH candidates AS (
    SELECT f."id", t."status" AS task_status
    FROM public."GoalFeature" f
    JOIN public."EngineeringTask" t ON t."id" = f."taskId"
    WHERE f."status" IS DISTINCT FROM CASE
      WHEN t."status" = 'SUCCEEDED' THEN 'SUCCEEDED'
      WHEN t."status" IN ('FAILED','DEAD_LETTER','CANCELLED','EXPIRED') THEN 'FAILED'
      WHEN t."status" = 'RUNNING' THEN 'RUNNING'
      WHEN t."status" = 'BLOCKED' THEN 'BLOCKED'
      WHEN t."status" IN ('WAITING_APPROVAL','WAITING_FOR_OWNER') THEN 'WAITING_APPROVAL'
      ELSE 'QUEUED'
    END
    ORDER BY f."updatedAt"
    LIMIT p_batch_size
  )
  UPDATE public."GoalFeature" f
  SET "status" = CASE
      WHEN c.task_status = 'SUCCEEDED' THEN 'SUCCEEDED'
      WHEN c.task_status IN ('FAILED','DEAD_LETTER','CANCELLED','EXPIRED') THEN 'FAILED'
      WHEN c.task_status = 'RUNNING' THEN 'RUNNING'
      WHEN c.task_status = 'BLOCKED' THEN 'BLOCKED'
      WHEN c.task_status IN ('WAITING_APPROVAL','WAITING_FOR_OWNER') THEN 'WAITING_APPROVAL'
      ELSE 'QUEUED'
    END,
    "updatedAt" = timezone('UTC', clock_timestamp())
  FROM candidates c
  WHERE f."id" = c."id";
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_updated := v_updated + v_count;

  WITH epic_states AS (
    SELECT e."id",
      CASE
        WHEN bool_and(f."status" = 'SUCCEEDED') THEN 'SUCCEEDED'
        WHEN bool_or(f."status" IN ('FAILED','BLOCKED')) THEN 'BLOCKED'
        WHEN bool_or(f."status" = 'RUNNING') THEN 'RUNNING'
        WHEN bool_or(f."status" = 'WAITING_APPROVAL') THEN 'WAITING_APPROVAL'
        ELSE 'QUEUED'
      END AS derived_status
    FROM public."GoalEpic" e
    JOIN public."GoalFeature" f ON f."epicId" = e."id"
    GROUP BY e."id"
  )
  UPDATE public."GoalEpic" e
  SET "status" = s.derived_status, "updatedAt" = clock_timestamp()
  FROM epic_states s
  WHERE e."id" = s."id" AND e."status" IS DISTINCT FROM s.derived_status;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_updated := v_updated + v_count;

  WITH goal_states AS (
    SELECT g."id",
      CASE
        WHEN bool_and(e."status" = 'SUCCEEDED') THEN 'SUCCEEDED'
        WHEN bool_or(e."status" IN ('BLOCKED','FAILED')) THEN 'BLOCKED'
        WHEN bool_or(e."status" = 'RUNNING') THEN 'RUNNING'
        WHEN bool_or(e."status" = 'WAITING_APPROVAL') THEN 'WAITING_APPROVAL'
        ELSE 'QUEUED'
      END AS derived_status
    FROM public."GoalRecord" g
    JOIN public."GoalEpic" e ON e."goalId" = g."id"
    GROUP BY g."id"
  )
  UPDATE public."GoalRecord" g
  SET "status" = s.derived_status, "updatedAt" = clock_timestamp()
  FROM goal_states s
  WHERE g."id" = s."id" AND g."status" IS DISTINCT FROM s.derived_status;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_updated := v_updated + v_count;

  RETURN v_updated;
END;
$$;
REVOKE ALL ON FUNCTION public.vayro_reconcile_goal_progress(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vayro_reconcile_goal_progress(INTEGER) TO vayro_task_scheduler;


-- Seed bounded deterministic adapters and a separate policy reviewer.
-- These are not unrestricted shell/code agents and cannot deploy or mutate products.
INSERT INTO public."EngineeringAgent" (
  "id","agentKey","version","displayName","capabilities","permissions","projectKeys","enabled","createdAt","updatedAt"
) VALUES
  (gen_random_uuid()::TEXT,'vayro-report-agent',1,'VAYRO Report Adapter',
   '["REPORT_GENERATION"]'::JSONB,'["READ_TASK","WRITE_TASK_RESULT"]'::JSONB,'[]'::JSONB,true,clock_timestamp(),clock_timestamp()),
  (gen_random_uuid()::TEXT,'vayro-repository-auditor',1,'VAYRO Repository Auditor',
   '["REPOSITORY_AUDIT"]'::JSONB,'["READ_TASK","READ_REPOSITORY","WRITE_TASK_RESULT"]'::JSONB,'[]'::JSONB,true,clock_timestamp(),clock_timestamp()),
  (gen_random_uuid()::TEXT,'vayro-ci-observer',1,'VAYRO CI Observer',
   '["CI_OBSERVATION"]'::JSONB,'["READ_TASK","READ_REPOSITORY","WRITE_TASK_RESULT"]'::JSONB,'[]'::JSONB,true,clock_timestamp(),clock_timestamp()),
  (gen_random_uuid()::TEXT,'vayro-policy-reviewer',1,'VAYRO Deterministic Policy Reviewer',
   '["TASK_REVIEW"]'::JSONB,'["READ_TASK"]'::JSONB,'[]'::JSONB,true,clock_timestamp(),clock_timestamp())
ON CONFLICT ("agentKey") DO NOTHING;

CREATE OR REPLACE FUNCTION public.vayro_resolve_engineering_agent(
  p_handler_key TEXT, p_project_key TEXT
) RETURNS TABLE (
  agent_id TEXT, agent_key TEXT, agent_version INTEGER,
  capabilities JSONB, permissions JSONB, project_keys JSONB
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE v_capability TEXT;
BEGIN
  v_capability := CASE p_handler_key
    WHEN 'report.generate' THEN 'REPORT_GENERATION'
    WHEN 'repo.audit' THEN 'REPOSITORY_AUDIT'
    WHEN 'repo.test' THEN 'CI_OBSERVATION'
    ELSE NULL
  END;
  IF v_capability IS NULL OR p_project_key IS NULL OR p_project_key !~ '^[A-Z][A-Z0-9_-]{1,39}$' THEN
    RAISE EXCEPTION 'AGENT_TASK_SCOPE_INVALID' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
  SELECT a."id",a."agentKey",a."version",a."capabilities",a."permissions",a."projectKeys"
  FROM public."EngineeringAgent" a
  WHERE a."enabled" = true
    AND a."capabilities" ? v_capability
    AND a."permissions" ? 'READ_TASK'
    AND (jsonb_array_length(a."projectKeys") = 0 OR a."projectKeys" ? p_project_key)
  ORDER BY a."agentKey"
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.vayro_resolve_task_reviewer(p_project_key TEXT)
RETURNS TABLE (
  agent_id TEXT, agent_key TEXT, agent_version INTEGER,
  capabilities JSONB, permissions JSONB, project_keys JSONB
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_project_key IS NULL OR p_project_key !~ '^[A-Z][A-Z0-9_-]{1,39}$' THEN
    RAISE EXCEPTION 'REVIEW_PROJECT_SCOPE_INVALID' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
  SELECT a."id",a."agentKey",a."version",a."capabilities",a."permissions",a."projectKeys"
  FROM public."EngineeringAgent" a
  WHERE a."enabled" = true
    AND a."capabilities" ? 'TASK_REVIEW'
    AND a."permissions" ? 'READ_TASK'
    AND (jsonb_array_length(a."projectKeys") = 0 OR a."projectKeys" ? p_project_key)
  ORDER BY a."agentKey"
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.vayro_record_engineering_task_review(
  p_task_id TEXT, p_worker_id TEXT, p_lease_token TEXT,
  p_executor_agent_key TEXT, p_reviewer_agent_key TEXT,
  p_decision TEXT, p_evidence JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE
  v_reviewer_id TEXT;
  v_project_key TEXT;
  v_attempt INTEGER;
  v_executor_valid BOOLEAN;
  v_count INTEGER;
BEGIN
  IF p_executor_agent_key IS NULL OR p_reviewer_agent_key IS NULL OR p_executor_agent_key = p_reviewer_agent_key THEN
    RAISE EXCEPTION 'TASK_REVIEW_NOT_INDEPENDENT' USING ERRCODE = '22023';
  END IF;
  IF p_decision IS NULL OR p_decision NOT IN ('APPROVE','BLOCK') THEN
    RAISE EXCEPTION 'TASK_REVIEW_DECISION_INVALID' USING ERRCODE = '22023';
  END IF;
  IF p_evidence IS NULL OR jsonb_typeof(p_evidence) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'TASK_REVIEW_EVIDENCE_INVALID' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_evidence) < 1 OR jsonb_array_length(p_evidence) > 50
     OR octet_length(p_evidence::TEXT) > 16000 THEN
    RAISE EXCEPTION 'TASK_REVIEW_EVIDENCE_INVALID' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_evidence) AS evidence_item(value)
    WHERE jsonb_typeof(evidence_item.value) IS DISTINCT FROM 'string'
       OR length(evidence_item.value #>> '{}') > 500
  ) THEN
    RAISE EXCEPTION 'TASK_REVIEW_EVIDENCE_INVALID' USING ERRCODE = '22023';
  END IF;

  SELECT t."projectKey",t."attemptCount" INTO v_project_key,v_attempt
  FROM public."EngineeringTask" t
  WHERE t."id" = p_task_id AND t."status" = 'RUNNING'
    AND t."leaseOwner" = p_worker_id AND t."leaseToken" = p_lease_token
    AND t."leaseExpiresAt" > clock_timestamp()
  FOR UPDATE;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  SELECT a."id" INTO v_reviewer_id
  FROM public."EngineeringAgent" a
  WHERE a."agentKey" = p_reviewer_agent_key AND a."enabled" = true
    AND a."capabilities" ? 'TASK_REVIEW'
    AND a."permissions" ? 'READ_TASK'
    AND (jsonb_array_length(a."projectKeys") = 0 OR a."projectKeys" ? v_project_key);
  IF v_reviewer_id IS NULL THEN
    RAISE EXCEPTION 'TASK_REVIEWER_NOT_AUTHORIZED' USING ERRCODE = '42501';
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM public."EngineeringAgent" a
    WHERE a."agentKey" = p_executor_agent_key AND a."enabled" = true
      AND a."permissions" ? 'READ_TASK'
      AND a."capabilities" ? CASE (SELECT t."handlerKey" FROM public."EngineeringTask" t WHERE t."id" = p_task_id)
        WHEN 'report.generate' THEN 'REPORT_GENERATION'
        WHEN 'repo.audit' THEN 'REPOSITORY_AUDIT'
        WHEN 'repo.test' THEN 'CI_OBSERVATION'
        ELSE '__NOT_ALLOWED__' END
      AND (jsonb_array_length(a."projectKeys") = 0 OR a."projectKeys" ? v_project_key)
  ) INTO v_executor_valid;
  IF NOT v_executor_valid THEN
    RAISE EXCEPTION 'TASK_EXECUTOR_NOT_AUTHORIZED' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public."TaskReview" (
    "id","taskId","executorAgentKey","reviewerAgentId","reviewRound","decision","evidence","createdAt"
  ) VALUES (
    gen_random_uuid()::TEXT,p_task_id,p_executor_agent_key,v_reviewer_id,v_attempt,p_decision,p_evidence,clock_timestamp()
  );
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.vayro_resolve_engineering_agent(TEXT,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vayro_resolve_task_reviewer(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vayro_record_engineering_task_review(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vayro_resolve_engineering_agent(TEXT,TEXT) TO vayro_task_worker;
GRANT EXECUTE ON FUNCTION public.vayro_resolve_task_reviewer(TEXT) TO vayro_task_worker;
GRANT EXECUTE ON FUNCTION public.vayro_record_engineering_task_review(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,JSONB) TO vayro_task_worker;
