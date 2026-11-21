-- Durable task ledger and lease-based worker protocol.
-- Workers receive EXECUTE-only access; they never receive table privileges.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vayro_task_worker') THEN
    CREATE ROLE vayro_task_worker NOLOGIN NOINHERIT;
  END IF;
END
$$;

CREATE TYPE public."EngineeringTaskStatus" AS ENUM (
  'DRAFT','QUEUED','RUNNING','BLOCKED','WAITING_APPROVAL',
  'RETRYING','SUCCEEDED','FAILED','CANCELLED','EXPIRED'
);

CREATE TABLE public."EngineeringTask" (
  "id" TEXT NOT NULL,
  "projectKey" VARCHAR(40) NOT NULL,
  "taskType" VARCHAR(80) NOT NULL,
  "handlerKey" VARCHAR(80) NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 50,
  "status" public."EngineeringTaskStatus" NOT NULL DEFAULT 'DRAFT',
  "payload" JSONB,
  "idempotencyKey" VARCHAR(200) NOT NULL,
  "scheduledAt" TIMESTAMP(3),
  "deadline" TIMESTAMP(3),
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
  "leaseOwner" VARCHAR(100),
  "leaseToken" VARCHAR(80),
  "leaseExpiresAt" TIMESTAMP(3),
  "heartbeatAt" TIMESTAMP(3),
  "result" JSONB,
  "lastErrorCode" VARCHAR(80),
  "lastErrorMessage" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "EngineeringTask_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EngineeringTask_idempotencyKey_key" UNIQUE ("idempotencyKey"),
  CONSTRAINT "EngineeringTask_priority_check" CHECK ("priority" BETWEEN 0 AND 100),
  CONSTRAINT "EngineeringTask_attempts_check" CHECK ("maxAttempts" BETWEEN 1 AND 10 AND "attemptCount" BETWEEN 0 AND "maxAttempts"),
  CONSTRAINT "EngineeringTask_lease_pair_check" CHECK (("leaseOwner" IS NULL) = ("leaseToken" IS NULL))
);

CREATE INDEX "EngineeringTask_status_availableAt_priority_idx"
  ON public."EngineeringTask" ("status", "availableAt", "priority" DESC, "createdAt");
CREATE INDEX "EngineeringTask_leaseExpiresAt_idx"
  ON public."EngineeringTask" ("leaseExpiresAt");
CREATE INDEX "EngineeringTask_projectKey_createdAt_idx"
  ON public."EngineeringTask" ("projectKey", "createdAt");

CREATE TABLE public."EngineeringTaskAttempt" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "workerId" VARCHAR(100) NOT NULL,
  "leaseToken" VARCHAR(80) NOT NULL,
  "status" VARCHAR(24) NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "errorCode" VARCHAR(80),
  "errorMessage" VARCHAR(500),
  "result" JSONB,
  CONSTRAINT "EngineeringTaskAttempt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EngineeringTaskAttempt_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES public."EngineeringTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EngineeringTaskAttempt_taskId_attemptNumber_key" UNIQUE ("taskId", "attemptNumber")
);
CREATE INDEX "EngineeringTaskAttempt_workerId_status_idx"
  ON public."EngineeringTaskAttempt" ("workerId", "status");

REVOKE ALL ON TABLE public."EngineeringTask", public."EngineeringTaskAttempt" FROM PUBLIC, anon, authenticated, service_role, vayro_app, vayro_auth, vayro_platform, vayro_platform_bootstrap, vayro_task_worker;

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

  -- Terminalize expired work before claiming another task. This prevents
  -- expired deadlines and exhausted leases from remaining RUNNING forever.
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

CREATE OR REPLACE FUNCTION public.vayro_heartbeat_engineering_task(
  p_task_id TEXT,p_worker_id TEXT,p_lease_token TEXT,p_lease_seconds INTEGER DEFAULT 60
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE v_count INTEGER;
BEGIN
  IF p_lease_seconds IS NULL OR p_lease_seconds < 10 OR p_lease_seconds > 300 THEN
    RAISE EXCEPTION 'TASK_LEASE_DURATION_INVALID' USING ERRCODE = '22023';
  END IF;
  UPDATE public."EngineeringTask"
  SET "heartbeatAt" = clock_timestamp(),
      "leaseExpiresAt" = clock_timestamp() + make_interval(secs => p_lease_seconds),
      "updatedAt" = clock_timestamp()
  WHERE "id" = p_task_id AND "status" = 'RUNNING'
    AND "leaseOwner" = p_worker_id AND "leaseToken" = p_lease_token
    AND "leaseExpiresAt" > clock_timestamp();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.vayro_complete_engineering_task(
  p_task_id TEXT,p_worker_id TEXT,p_lease_token TEXT,p_result JSONB DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE v_attempt_number INTEGER; v_count INTEGER;
BEGIN
  IF p_result IS NOT NULL AND octet_length(p_result::TEXT) > 65536 THEN
    RAISE EXCEPTION 'TASK_RESULT_TOO_LARGE' USING ERRCODE = '22023';
  END IF;
  UPDATE public."EngineeringTask"
  SET "status" = 'SUCCEEDED',"result" = p_result,
      "completedAt" = clock_timestamp(),"updatedAt" = clock_timestamp(),
      "leaseOwner" = NULL,"leaseToken" = NULL,"leaseExpiresAt" = NULL,"heartbeatAt" = NULL
  WHERE "id" = p_task_id AND "status" = 'RUNNING'
    AND "leaseOwner" = p_worker_id AND "leaseToken" = p_lease_token
    AND "leaseExpiresAt" > clock_timestamp()
  RETURNING "attemptCount" INTO v_attempt_number;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 1 THEN RETURN FALSE; END IF;

  UPDATE public."EngineeringTaskAttempt"
  SET "status" = 'SUCCEEDED',"result" = p_result,"finishedAt" = clock_timestamp()
  WHERE "taskId" = p_task_id AND "attemptNumber" = v_attempt_number
    AND "workerId" = p_worker_id AND "leaseToken" = p_lease_token AND "status" = 'RUNNING';
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.vayro_fail_engineering_task(
  p_task_id TEXT,p_worker_id TEXT,p_lease_token TEXT,
  p_error_code TEXT,p_error_message TEXT,p_retryable BOOLEAN DEFAULT TRUE
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE
  v_attempt_number INTEGER; v_max_attempts INTEGER; v_retry BOOLEAN;
  v_status TEXT; v_count INTEGER;
BEGIN
  IF p_error_code IS NULL OR p_error_code !~ '^[A-Z0-9_]{2,80}$' THEN
    RAISE EXCEPTION 'TASK_ERROR_CODE_INVALID' USING ERRCODE = '22023';
  END IF;
  IF p_error_message IS NULL OR length(p_error_message) > 500 THEN
    RAISE EXCEPTION 'TASK_ERROR_MESSAGE_INVALID' USING ERRCODE = '22023';
  END IF;

  SELECT t."attemptCount",t."maxAttempts" INTO v_attempt_number,v_max_attempts
  FROM public."EngineeringTask" t
  WHERE t."id" = p_task_id AND t."status" = 'RUNNING'
    AND t."leaseOwner" = p_worker_id AND t."leaseToken" = p_lease_token
    AND t."leaseExpiresAt" > clock_timestamp()
  FOR UPDATE;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  v_retry := COALESCE(p_retryable,FALSE) AND v_attempt_number < v_max_attempts;
  v_status := CASE WHEN v_retry THEN 'RETRYING' ELSE 'FAILED' END;
  UPDATE public."EngineeringTask"
  SET "status" = v_status::public."EngineeringTaskStatus",
      "availableAt" = CASE WHEN v_retry
        THEN clock_timestamp() + make_interval(secs => LEAST(3600,5 * power(2,GREATEST(0,v_attempt_number - 1)))::DOUBLE PRECISION)
        ELSE "availableAt" END,
      "lastErrorCode" = p_error_code,"lastErrorMessage" = p_error_message,
      "completedAt" = CASE WHEN v_retry THEN NULL ELSE clock_timestamp() END,
      "updatedAt" = clock_timestamp(),
      "leaseOwner" = NULL,"leaseToken" = NULL,"leaseExpiresAt" = NULL,"heartbeatAt" = NULL
  WHERE "id" = p_task_id;

  UPDATE public."EngineeringTaskAttempt"
  SET "status" = v_status,"errorCode" = p_error_code,
      "errorMessage" = p_error_message,"finishedAt" = clock_timestamp()
  WHERE "taskId" = p_task_id AND "attemptNumber" = v_attempt_number
    AND "workerId" = p_worker_id AND "leaseToken" = p_lease_token AND "status" = 'RUNNING';
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.vayro_claim_engineering_task(TEXT,INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vayro_heartbeat_engineering_task(TEXT,TEXT,TEXT,INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vayro_complete_engineering_task(TEXT,TEXT,TEXT,JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vayro_fail_engineering_task(TEXT,TEXT,TEXT,TEXT,TEXT,BOOLEAN) FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO vayro_task_worker;
GRANT EXECUTE ON FUNCTION public.vayro_claim_engineering_task(TEXT,INTEGER) TO vayro_task_worker;
GRANT EXECUTE ON FUNCTION public.vayro_heartbeat_engineering_task(TEXT,TEXT,TEXT,INTEGER) TO vayro_task_worker;
GRANT EXECUTE ON FUNCTION public.vayro_complete_engineering_task(TEXT,TEXT,TEXT,JSONB) TO vayro_task_worker;
GRANT EXECUTE ON FUNCTION public.vayro_fail_engineering_task(TEXT,TEXT,TEXT,TEXT,TEXT,BOOLEAN) TO vayro_task_worker;
