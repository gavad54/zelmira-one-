-- Disposable PostgreSQL CI only. Never run against live VAYRO-CORE.
BEGIN;
INSERT INTO public."EngineeringTask" (
  "id","projectKey","taskType","handlerKey","title","status","payload",
  "idempotencyKey","maxAttempts","attemptCount","availableAt","updatedAt"
) VALUES (
  'ci-agent-review-task','VAYRO','ENGINEERING','repo.audit','Verify registered agent review',
  'QUEUED','{"repo":"gavad54/zelmira-one-"}'::jsonb,
  'ci-agent-review-idempotency',3,0,timezone('UTC',clock_timestamp()),timezone('UTC',clock_timestamp())
);
DO $$
DECLARE
  v_task RECORD;
  v_executor RECORD;
  v_reviewer RECORD;
  v_reviewed BOOLEAN;
  v_completed BOOLEAN;
  v_count INTEGER;
BEGIN
  SELECT * INTO v_task FROM public.vayro_claim_engineering_task('ci-agent-review-worker',60);
  IF v_task.task_id IS DISTINCT FROM 'ci-agent-review-task' OR v_task.lease_token IS NULL THEN
    RAISE EXCEPTION 'AGENT_REVIEW_TASK_CLAIM_FAILED';
  END IF;
  SELECT * INTO v_executor FROM public.vayro_resolve_engineering_agent(v_task.handler_key,v_task.project_key);
  SELECT * INTO v_reviewer FROM public.vayro_resolve_task_reviewer(v_task.project_key);
  IF v_executor.agent_key IS NULL OR v_reviewer.agent_key IS NULL OR v_executor.agent_key = v_reviewer.agent_key THEN
    RAISE EXCEPTION 'AGENT_REVIEW_IDENTITY_RESOLUTION_FAILED';
  END IF;
  SELECT public.vayro_record_engineering_task_review(
    v_task.task_id,'ci-agent-review-worker',v_task.lease_token,
    v_executor.agent_key,v_reviewer.agent_key,'APPROVE',
    '["Handler-specific output contract passed.","Read-only execution boundary is declared."]'::jsonb
  ) INTO v_reviewed;
  IF v_reviewed IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'AGENT_REVIEW_RECORD_FAILED'; END IF;
  SELECT public.vayro_complete_engineering_task(
    v_task.task_id,'ci-agent-review-worker',v_task.lease_token,'{"reviewed":true}'::jsonb
  ) INTO v_completed;
  IF v_completed IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'AGENT_REVIEW_TASK_COMPLETION_FAILED'; END IF;
  SELECT count(*) INTO v_count FROM public."TaskReview"
  WHERE "taskId"=v_task.task_id AND "reviewerAgentId"=v_reviewer.agent_id
    AND "executorAgentKey"=v_executor.agent_key AND "decision"='APPROVE';
  IF v_count <> 1 THEN RAISE EXCEPTION 'AGENT_REVIEW_AUDIT_RECORD_MISSING'; END IF;
END
$$;
ROLLBACK;
SELECT 'VAYRO_AGENT_REVIEW_INTEGRATION_PASS' AS result;