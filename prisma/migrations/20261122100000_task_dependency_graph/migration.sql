-- Durable dependency graph for engineering tasks.
-- Task prerequisites are enforced inside the worker claim transaction.

CREATE TABLE public."EngineeringTaskDependency" (
  "taskId" TEXT NOT NULL,
  "dependsOnTaskId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EngineeringTaskDependency_pkey" PRIMARY KEY ("taskId", "dependsOnTaskId"),
  CONSTRAINT "EngineeringTaskDependency_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES public."EngineeringTask"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EngineeringTaskDependency_dependsOnTaskId_fkey"
    FOREIGN KEY ("dependsOnTaskId") REFERENCES public."EngineeringTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EngineeringTaskDependency_no_self_dependency" CHECK ("taskId" <> "dependsOnTaskId")
);
CREATE INDEX "EngineeringTaskDependency_dependsOnTaskId_idx"
  ON public."EngineeringTaskDependency" ("dependsOnTaskId");

ALTER TABLE public."EngineeringTaskDependency" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."EngineeringTaskDependency"
  FROM PUBLIC, anon, authenticated, service_role, vayro_app, vayro_auth,
       vayro_platform, vayro_platform_bootstrap, vayro_task_worker;

-- Serialize dependency graph writes so concurrent owner requests cannot create
-- a cycle by racing each other. The worker never receives table access.
CREATE OR REPLACE FUNCTION public.vayro_add_engineering_task_dependency(
  p_task_id TEXT, p_depends_on_task_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE
  v_task_project TEXT;
  v_dependency_project TEXT;
  v_cycle BOOLEAN;
BEGIN
  IF NOT public.vayro_platform_actor_is_owner() THEN
    RAISE EXCEPTION 'TASK_DEPENDENCY_FORBIDDEN' USING ERRCODE = '42501';
  END IF;
  IF p_task_id IS NULL OR p_depends_on_task_id IS NULL OR p_task_id = p_depends_on_task_id THEN
    RAISE EXCEPTION 'TASK_DEPENDENCY_INVALID' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(734901221);

  SELECT "projectKey" INTO v_task_project
  FROM public."EngineeringTask" WHERE "id" = p_task_id FOR UPDATE;
  SELECT "projectKey" INTO v_dependency_project
  FROM public."EngineeringTask" WHERE "id" = p_depends_on_task_id FOR SHARE;

  IF v_task_project IS NULL OR v_dependency_project IS NULL THEN
    RAISE EXCEPTION 'TASK_DEPENDENCY_NOT_FOUND' USING ERRCODE = '23503';
  END IF;
  IF v_task_project <> v_dependency_project THEN
    RAISE EXCEPTION 'TASK_DEPENDENCY_PROJECT_MISMATCH' USING ERRCODE = '23514';
  END IF;

  WITH RECURSIVE reachable(id, path) AS (
    SELECT p_depends_on_task_id, ARRAY[p_depends_on_task_id]::TEXT[]
    UNION ALL
    SELECT d."dependsOnTaskId", r.path || d."dependsOnTaskId"
    FROM reachable r
    JOIN public."EngineeringTaskDependency" d ON d."taskId" = r.id
    WHERE NOT d."dependsOnTaskId" = ANY(r.path)
  )
  SELECT EXISTS (SELECT 1 FROM reachable WHERE id = p_task_id) INTO v_cycle;

  IF v_cycle THEN
    RAISE EXCEPTION 'TASK_DEPENDENCY_CYCLE' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public."EngineeringTaskDependency" ("taskId", "dependsOnTaskId")
  VALUES (p_task_id, p_depends_on_task_id)
  ON CONFLICT ("taskId", "dependsOnTaskId") DO NOTHING;
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.vayro_add_engineering_task_dependency(TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vayro_add_engineering_task_dependency(TEXT,TEXT) TO vayro_platform;

-- Replace claim so a task is eligible only after every prerequisite succeeded.
CREATE OR REPLACE FUNCTION public.vayro_claim_engineering_task(p_worker_id TEXT, p_lease_seconds INTEGER DEFAULT 60)
RETURNS TABLE (
  task_id TEXT, project_key TEXT, task_type TEXT, handler_key TEXT, title TEXT,
  payload JSONB, attempt_number INTEGER, lease_token TEXT, deadline TIMESTAMP(3)
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE
  v_task public."EngineeringTask"%ROWTYPE;
BEGIN
  IF p_worker_id IS NULL OR p_worker_id !~ '^[A-Za-z0-9._:-]{3,100}$' THEN
    RAISE EXCEPTION 'TASK_WORKER_ID_INVALID' USING ERRCODE = '22023';
  END IF;
  IF p_lease_seconds IS NULL OR p_lease_seconds < 10 OR p_lease_seconds > 300 THEN
    RAISE EXCEPTION 'TASK_LEASE_DURATION_INVALID' USING ERRCODE = '22023';
  END IF;

  UPDATE public."EngineeringTask" t
  SET "status" = 'EXPIRED', "completedAt" = clock_timestamp(), "updatedAt" = clock_timestamp(),
      "leaseOwner" = NULL, "leaseToken" = NULL, "leaseExpiresAt" = NULL, "heartbeatAt" = NULL
  WHERE t."status" IN ('QUEUED','RETRYING','RUNNING')
    AND t."deadline" IS NOT NULL AND t."deadline" <= clock_timestamp();

  UPDATE public."EngineeringTaskAttempt" a
  SET "status" = 'DEADLINE_EXPIRED', "finishedAt" = clock_timestamp()
  WHERE a."status" = 'RUNNING'
    AND EXISTS (SELECT 1 FROM public."EngineeringTask" t WHERE t."id" = a."taskId" AND t."status" = 'EXPIRED');

  UPDATE public."EngineeringTask" t
  SET "status" = 'FAILED', "completedAt" = clock_timestamp(), "updatedAt" = clock_timestamp(),
      "leaseOwner" = NULL, "leaseToken" = NULL, "leaseExpiresAt" = NULL, "heartbeatAt" = NULL,
      "lastErrorCode" = 'LEASE_ATTEMPTS_EXHAUSTED',
      "lastErrorMessage" = 'Worker lease expired after the maximum number of attempts'
  WHERE t."status" = 'RUNNING' AND t."leaseExpiresAt" <= clock_timestamp()
    AND t."attemptCount" >= t."maxAttempts";

  UPDATE public."EngineeringTaskAttempt" a
  SET "status" = 'LEASE_EXPIRED', "finishedAt" = clock_timestamp()
  WHERE a."status" = 'RUNNING'
    AND EXISTS (SELECT 1 FROM public."EngineeringTask" t WHERE t."id" = a."taskId" AND t."status" = 'FAILED' AND t."lastErrorCode" = 'LEASE_ATTEMPTS_EXHAUSTED');

  SELECT t.* INTO v_task
  FROM public."EngineeringTask" t
  WHERE (
    (t."status" IN ('QUEUED','RETRYING') AND t."availableAt" <= clock_timestamp())
    OR (t."status" = 'RUNNING' AND t."leaseExpiresAt" <= clock_timestamp())
  )
  AND t."attemptCount" < t."maxAttempts"
  AND (t."deadline" IS NULL OR t."deadline" > clock_timestamp())
  AND NOT EXISTS (
    SELECT 1
    FROM public."EngineeringTaskDependency" d
    JOIN public."EngineeringTask" prerequisite ON prerequisite."id" = d."dependsOnTaskId"
    WHERE d."taskId" = t."id" AND prerequisite."status" <> 'SUCCEEDED'
  )
  ORDER BY t."priority" DESC, t."availableAt", t."createdAt"
  LIMIT 1 FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN RETURN; END IF;

  IF v_task."status" = 'RUNNING' THEN
    UPDATE public."EngineeringTaskAttempt"
    SET "status" = 'LEASE_EXPIRED', "finishedAt" = clock_timestamp()
    WHERE "taskId" = v_task."id" AND "status" = 'RUNNING';
  END IF;

  UPDATE public."EngineeringTask"
  SET "status" = 'RUNNING',
      "attemptCount" = "attemptCount" + 1,
      "leaseOwner" = p_worker_id,
      "leaseToken" = gen_random_uuid()::TEXT,
      "leaseExpiresAt" = clock_timestamp() + make_interval(secs => p_lease_seconds),
      "heartbeatAt" = clock_timestamp(),
      "startedAt" = COALESCE("startedAt", clock_timestamp()),
      "updatedAt" = clock_timestamp()
  WHERE "id" = v_task."id"
  RETURNING * INTO v_task;

  INSERT INTO public."EngineeringTaskAttempt" (
    "id","taskId","attemptNumber","workerId","leaseToken","status","startedAt"
  ) VALUES (
    gen_random_uuid()::TEXT,v_task."id",v_task."attemptCount",p_worker_id,
    v_task."leaseToken",'RUNNING',clock_timestamp()
  );

  RETURN QUERY SELECT v_task."id",v_task."projectKey"::TEXT,v_task."taskType"::TEXT,
    v_task."handlerKey"::TEXT,v_task."title"::TEXT,v_task."payload",
    v_task."attemptCount",v_task."leaseToken"::TEXT,v_task."deadline";
END;
$$;
