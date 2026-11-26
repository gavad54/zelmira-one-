-- Disposable PostgreSQL CI only. Never run against live VAYRO-CORE.
BEGIN;
DO $$
DECLARE
  v_now TIMESTAMP(3) := timezone('UTC', clock_timestamp())::TIMESTAMP(3);
  v_start TIMESTAMP(3);
  v_expected_skip TIMESTAMP(3);
  v_created INTEGER;
  v_count INTEGER;
  v_enabled BOOLEAN;
  v_status TEXT;
BEGIN
  v_start := v_now - INTERVAL '4 days';
  INSERT INTO public."RecurringSchedule" (
    "id","scheduleKey","projectKey","handlerKey","title","interval","unit",
    "missedRunPolicy","startAt","nextRunAt","maxRuns","runCount","enabled","createdAt","updatedAt"
  ) VALUES (
    'ci-catchup-schedule','ci-catchup-schedule','VAYRO','repo.audit','CI catch-up schedule',1,'DAYS',
    'CATCH_UP_ONCE',v_start,v_start,3,0,true,v_now,v_now
  );
  SELECT public.vayro_materialize_due_engineering_schedules('ci-scheduler-test',10) INTO v_created;
  IF v_created <> 1 THEN RAISE EXCEPTION 'CATCH_UP_MATERIALIZATION_COUNT_INVALID: %', v_created; END IF;
  SELECT count(*) INTO v_count FROM public."EngineeringTask" WHERE "idempotencyKey" LIKE 'schedule:ci-catchup-schedule:%';
  IF v_count <> 1 THEN RAISE EXCEPTION 'CATCH_UP_DUPLICATE_OR_MISSING_TASK: %', v_count; END IF;
  SELECT "scheduledAt" INTO v_expected_skip FROM public."EngineeringTask" WHERE "idempotencyKey" LIKE 'schedule:ci-catchup-schedule:%';
  IF v_expected_skip IS DISTINCT FROM v_start THEN RAISE EXCEPTION 'CATCH_UP_DID_NOT_USE_OLDEST_OCCURRENCE'; END IF;
  SELECT "nextRunAt","enabled" INTO v_start,v_enabled FROM public."RecurringSchedule" WHERE "scheduleKey"='ci-catchup-schedule';
  IF v_start <= v_now OR NOT v_enabled THEN RAISE EXCEPTION 'CATCH_UP_DID_NOT_ADVANCE_PAST_BACKLOG'; END IF;
  SELECT public.vayro_materialize_due_engineering_schedules('ci-scheduler-test',10) INTO v_created;
  IF v_created <> 0 THEN RAISE EXCEPTION 'CATCH_UP_REPLAYED_BACKLOG'; END IF;

  v_start := v_now - INTERVAL '4 days';
  v_expected_skip := v_start + floor(extract(epoch FROM (v_now - v_start)) / 86400)::INTEGER * INTERVAL '1 day';
  INSERT INTO public."RecurringSchedule" (
    "id","scheduleKey","projectKey","handlerKey","title","interval","unit",
    "missedRunPolicy","startAt","nextRunAt","maxRuns","runCount","enabled","createdAt","updatedAt"
  ) VALUES (
    'ci-skip-schedule','ci-skip-schedule','VAYRO','repo.test','CI skip schedule',1,'DAYS',
    'SKIP',v_start,v_start,3,0,true,v_now,v_now
  );
  SELECT public.vayro_materialize_due_engineering_schedules('ci-scheduler-test',10) INTO v_created;
  IF v_created <> 1 THEN RAISE EXCEPTION 'SKIP_MATERIALIZATION_COUNT_INVALID: %', v_created; END IF;
  IF NOT EXISTS (SELECT 1 FROM public."EngineeringTask" WHERE "idempotencyKey" = 'schedule:ci-skip-schedule:' || to_char(v_expected_skip,'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) THEN
    RAISE EXCEPTION 'SKIP_DID_NOT_USE_LATEST_DUE_OCCURRENCE';
  END IF;

  INSERT INTO public."EngineeringTask" (
    "id","projectKey","taskType","handlerKey","title","status","idempotencyKey","maxAttempts","attemptCount","availableAt","updatedAt"
  ) VALUES (
    'ci-goal-task','VAYRO','ENGINEERING','repo.audit','CI goal task','SUCCEEDED','ci-goal-task-key',3,1,v_now,v_now
  );
  INSERT INTO public."GoalRecord" (
    "id","goalKey","projectKey","title","version","status","priority","approvalRequired","createdAt","updatedAt"
  ) VALUES ('ci-goal','CI-GOAL','VAYRO','CI goal reconciliation',1,'PLANNED',50,true,v_now,v_now);
  INSERT INTO public."GoalEpic" (
    "id","goalId","epicKey","title","status","sortOrder","createdAt","updatedAt"
  ) VALUES ('ci-epic','ci-goal','CI-EPIC','CI epic','PLANNED',0,v_now,v_now);
  INSERT INTO public."GoalFeature" (
    "id","epicId","featureKey","title","acceptanceCriteria","handlerKey","status","taskId","sortOrder","createdAt","updatedAt"
  ) VALUES ('ci-feature','ci-epic','CI-FEATURE','CI feature','Task must succeed','repo.audit','QUEUED','ci-goal-task',0,v_now,v_now);
  PERFORM public.vayro_reconcile_goal_progress(100);
  SELECT "status" INTO v_status FROM public."GoalFeature" WHERE "id"='ci-feature';
  IF v_status <> 'SUCCEEDED' THEN RAISE EXCEPTION 'GOAL_FEATURE_RECONCILIATION_FAILED'; END IF;
  SELECT "status" INTO v_status FROM public."GoalEpic" WHERE "id"='ci-epic';
  IF v_status <> 'SUCCEEDED' THEN RAISE EXCEPTION 'GOAL_EPIC_RECONCILIATION_FAILED'; END IF;
  SELECT "status" INTO v_status FROM public."GoalRecord" WHERE "id"='ci-goal';
  IF v_status <> 'SUCCEEDED' THEN RAISE EXCEPTION 'GOAL_RECORD_RECONCILIATION_FAILED'; END IF;
END
$$;
ROLLBACK;
SELECT 'VAYRO_RECURRING_SCHEDULER_AND_GOAL_RECONCILIATION_PASS' AS result;