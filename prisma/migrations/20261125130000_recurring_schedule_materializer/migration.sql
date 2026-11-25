-- Dedicated least-privilege role and durable recurring schedule materializer.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vayro_task_scheduler') THEN
    CREATE ROLE vayro_task_scheduler NOLOGIN NOINHERIT;
  END IF;
END
$$;
ALTER ROLE vayro_task_scheduler INHERIT;

CREATE OR REPLACE FUNCTION public.vayro_materialize_due_engineering_schedules(
  p_scheduler_id TEXT,
  p_batch_size INTEGER DEFAULT 10
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE
  v_schedule public."RecurringSchedule"%ROWTYPE;
  v_now TIMESTAMP(3) := clock_timestamp()::TIMESTAMP(3);
  v_interval_ms BIGINT;
  v_elapsed_ms BIGINT;
  v_occurrence TIMESTAMP(3);
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

    IF v_schedule."missedRunPolicy" = 'CATCH_UP_ONCE' THEN
      v_occurrence := v_schedule."nextRunAt";
    ELSE
      v_elapsed_ms := floor(extract(epoch FROM (v_now - v_schedule."nextRunAt")) * 1000)::BIGINT;
      v_occurrence := v_schedule."nextRunAt" + make_interval(secs => (floor(v_elapsed_ms::NUMERIC / v_interval_ms) * v_interval_ms / 1000)::DOUBLE PRECISION);
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
        'scheduledFor",to_char(v_occurrence AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      ),
      'schedule:' || v_schedule."scheduleKey" || ':' || to_char(v_occurrence AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      v_occurrence,v_now,3,0,false,v_now,v_now
    )
    ON CONFLICT ("idempotencyKey") DO NOTHING;
    GET DIAGNOSTICS v_run_count = ROW_COUNT;
    v_created := v_created + v_run_count;

    v_next := v_occurrence + make_interval(secs => (v_interval_ms / 1000)::DOUBLE PRECISION);
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
