-- Disposable PostgreSQL CI only. Never run against live VAYRO-CORE.
-- Simulates a worker process disappearing after claim, then verifies lease recovery.
BEGIN;

INSERT INTO public."EngineeringTask" (
  "id", "projectKey", "taskType", "handlerKey", "title",
  "status", "payload", "idempotencyKey", "maxAttempts", "attemptCount",
  "availableAt", "updatedAt"
) VALUES (
  'restart-recovery-task', 'VAYRO', 'ENGINEERING', 'repo.audit',
  'Verify worker restart recovery', 'QUEUED',
  '{"repo":"gavad54/zelmira-one-"}'::jsonb,
  'ci-restart-recovery-idempotency-key', 3, 0,
  clock_timestamp() - INTERVAL '1 second', clock_timestamp()
);

DO $$
DECLARE
  v_first RECORD;
  v_second RECORD;
  v_stale_completion BOOLEAN;
  v_second_completion BOOLEAN;
  v_attempt_one_status TEXT;
  v_attempt_two_status TEXT;
BEGIN
  SELECT * INTO v_first
  FROM public.vayro_claim_engineering_task('worker-before-restart', 10);

  IF v_first.task_id IS DISTINCT FROM 'restart-recovery-task'
     OR v_first.attempt_number IS DISTINCT FROM 1
     OR v_first.lease_token IS NULL THEN
    RAISE EXCEPTION 'RESTART_RECOVERY_INITIAL_CLAIM_FAILED';
  END IF;

  -- Simulate process loss: no heartbeat or completion arrives before lease expiry.
  UPDATE public."EngineeringTask"
  SET "leaseExpiresAt" = clock_timestamp() - INTERVAL '1 second'
  WHERE "id" = 'restart-recovery-task' AND "leaseToken" = v_first.lease_token;

  SELECT * INTO v_second
  FROM public.vayro_claim_engineering_task('worker-after-restart', 10);

  IF v_second.task_id IS DISTINCT FROM 'restart-recovery-task'
     OR v_second.attempt_number IS DISTINCT FROM 2
     OR v_second.lease_token IS NULL
     OR v_second.lease_token = v_first.lease_token THEN
    RAISE EXCEPTION 'RESTART_RECOVERY_RECLAIM_FAILED';
  END IF;

  SELECT public.vayro_complete_engineering_task(
    v_first.task_id, 'worker-before-restart', v_first.lease_token, '{"stale":true}'::jsonb
  ) INTO v_stale_completion;

  IF v_stale_completion IS DISTINCT FROM FALSE THEN
    RAISE EXCEPTION 'RESTART_RECOVERY_STALE_WORKER_WAS_ACCEPTED';
  END IF;

  SELECT public.vayro_complete_engineering_task(
    v_second.task_id, 'worker-after-restart', v_second.lease_token, '{"recovered":true}'::jsonb
  ) INTO v_second_completion;

  IF v_second_completion IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'RESTART_RECOVERY_NEW_WORKER_COMPLETION_FAILED';
  END IF;

  SELECT "status" INTO v_attempt_one_status
  FROM public."EngineeringTaskAttempt"
  WHERE "taskId" = 'restart-recovery-task' AND "attemptNumber" = 1;

  SELECT "status" INTO v_attempt_two_status
  FROM public."EngineeringTaskAttempt"
  WHERE "taskId" = 'restart-recovery-task' AND "attemptNumber" = 2;

  IF v_attempt_one_status IS DISTINCT FROM 'LEASE_EXPIRED'
     OR v_attempt_two_status IS DISTINCT FROM 'SUCCEEDED' THEN
    RAISE EXCEPTION 'RESTART_RECOVERY_ATTEMPT_LEDGER_INVALID';
  END IF;
END
$$;

ROLLBACK;

SELECT 'TASK_WORKER_RESTART_RECOVERY_PASS' AS result;
