-- Isolated PostgreSQL integration test: prerequisites gate claims until success.
-- Run only in CI after all Prisma migrations and worker login-role setup.
\set ON_ERROR_STOP on

INSERT INTO public."EngineeringTask"
  ("id","projectKey","taskType","handlerKey","title","priority","status","idempotencyKey","updatedAt","availableAt")
VALUES
  ('dep-prerequisite','VAYRO','ENGINEERING','report.generate','Dependency prerequisite',100,'QUEUED','ci-dep-prerequisite',clock_timestamp(),clock_timestamp() - interval '1 second'),
  ('dep-dependent','VAYRO','ENGINEERING','report.generate','Dependency dependent',90,'QUEUED','ci-dep-dependent',clock_timestamp(),clock_timestamp() - interval '1 second'),
  ('dep-independent','VAYRO','ENGINEERING','report.generate','Independent task',80,'QUEUED','ci-dep-independent',clock_timestamp(),clock_timestamp() - interval '1 second');

INSERT INTO public."EngineeringTaskDependency" ("taskId","dependsOnTaskId")
VALUES ('dep-dependent','dep-prerequisite');

  INSERT INTO public."EngineeringTask"
    ("id","projectKey","taskType","handlerKey","title","priority","status","idempotencyKey","updatedAt","availableAt")
  VALUES
    ('dep-failed-prerequisite','VAYRO','ENGINEERING','report.generate','Failed prerequisite',100,'QUEUED','ci-dep-failed-prerequisite',clock_timestamp(),clock_timestamp() - interval '1 second'),
    ('dep-failed-dependent','VAYRO','ENGINEERING','report.generate','Failed dependent',90,'QUEUED','ci-dep-failed-dependent',clock_timestamp(),clock_timestamp() - interval '1 second'),
    ('dep-failed-independent','VAYRO','ENGINEERING','report.generate','Independent after failure',80,'QUEUED','ci-dep-failed-independent',clock_timestamp(),clock_timestamp() - interval '1 second');
  INSERT INTO public."EngineeringTaskDependency" ("taskId","dependsOnTaskId")
  VALUES ('dep-failed-dependent','dep-failed-prerequisite');

SET ROLE vayro_task_worker_ci;
DO $dependency_test$
DECLARE
  prerequisite_claim RECORD;
  independent_claim RECORD;
  blocked_claim RECORD;
  dependent_claim RECORD;
BEGIN
  SELECT * INTO prerequisite_claim
  FROM public.vayro_claim_engineering_task('dependency-ci-worker',60);
  IF prerequisite_claim.task_id IS DISTINCT FROM 'dep-prerequisite' THEN
    RAISE EXCEPTION 'DEPENDENCY_TEST_EXPECTED_PREREQUISITE_FIRST got=%', prerequisite_claim.task_id;
  END IF;

  SELECT * INTO independent_claim
  FROM public.vayro_claim_engineering_task('dependency-ci-worker',60);
  IF independent_claim.task_id IS DISTINCT FROM 'dep-independent' THEN
    RAISE EXCEPTION 'DEPENDENCY_TEST_EXPECTED_INDEPENDENT_WHILE_PREREQUISITE_RUNNING got=%', independent_claim.task_id;
  END IF;

  IF NOT public.vayro_complete_engineering_task(
    independent_claim.task_id,'dependency-ci-worker',independent_claim.lease_token,'{"verified":true}'::jsonb
  ) THEN
    RAISE EXCEPTION 'DEPENDENCY_TEST_INDEPENDENT_COMPLETION_FAILED';
  END IF;

  SELECT * INTO blocked_claim
  FROM public.vayro_claim_engineering_task('dependency-ci-worker',60);
  IF blocked_claim.task_id IS NOT NULL THEN
    RAISE EXCEPTION 'DEPENDENCY_TEST_DEPENDENT_CLAIMED_BEFORE_PREREQUISITE_SUCCESS got=%', blocked_claim.task_id;
  END IF;

  IF NOT public.vayro_complete_engineering_task(
    prerequisite_claim.task_id,'dependency-ci-worker',prerequisite_claim.lease_token,'{"verified":true}'::jsonb
  ) THEN
    RAISE EXCEPTION 'DEPENDENCY_TEST_PREREQUISITE_COMPLETION_FAILED';
  END IF;

  SELECT * INTO dependent_claim
  FROM public.vayro_claim_engineering_task('dependency-ci-worker',60);
  IF dependent_claim.task_id IS DISTINCT FROM 'dep-dependent' THEN
    RAISE EXCEPTION 'DEPENDENCY_TEST_EXPECTED_DEPENDENT_AFTER_SUCCESS got=%', dependent_claim.task_id;
  END IF;
END
$dependency_test$;
  -- A terminal prerequisite failure must terminalize its dependent instead
  -- of leaving it queued forever, while unrelated work remains claimable.
  SELECT * INTO prerequisite_claim
  FROM public.vayro_claim_engineering_task('dependency-ci-worker',60);
  IF prerequisite_claim.task_id IS DISTINCT FROM 'dep-failed-prerequisite' THEN
    RAISE EXCEPTION 'DEPENDENCY_FAILURE_EXPECTED_PREREQUISITE got=%', prerequisite_claim.task_id;
  END IF;
  IF NOT public.vayro_fail_engineering_task(
    prerequisite_claim.task_id,'dependency-ci-worker',prerequisite_claim.lease_token,
    'UPSTREAM_REJECTED','Prerequisite permanently failed',FALSE
  ) THEN
    RAISE EXCEPTION 'DEPENDENCY_FAILURE_PREREQUISITE_TERMINALIZATION_FAILED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public."EngineeringTask"
    WHERE "id"='dep-failed-dependent' AND "status"='BLOCKED'
      AND "lastErrorCode"='DEPENDENCY_FAILED'
  ) THEN
    RAISE EXCEPTION 'DEPENDENCY_FAILURE_DEPENDENT_NOT_BLOCKED';
  END IF;

  SELECT * INTO independent_claim
  FROM public.vayro_claim_engineering_task('dependency-ci-worker',60);
  IF independent_claim.task_id IS DISTINCT FROM 'dep-failed-independent' THEN
    RAISE EXCEPTION 'DEPENDENCY_FAILURE_INDEPENDENT_WORK_STOPPED got=%', independent_claim.task_id;
  END IF;
  IF NOT public.vayro_complete_engineering_task(
    independent_claim.task_id,'dependency-ci-worker',independent_claim.lease_token,'{"verified":true}'::jsonb
  ) THEN
    RAISE EXCEPTION 'DEPENDENCY_FAILURE_INDEPENDENT_COMPLETION_FAILED';
  END IF;

RESET ROLE;

DELETE FROM public."EngineeringTaskAttempt"
WHERE "taskId" IN ('dep-prerequisite','dep-dependent','dep-independent','dep-failed-prerequisite','dep-failed-dependent','dep-failed-independent');
DELETE FROM public."EngineeringTaskDependency"
WHERE "taskId" IN ('dep-prerequisite','dep-dependent','dep-independent')
   OR "dependsOnTaskId" IN ('dep-prerequisite','dep-dependent','dep-independent');
DELETE FROM public."EngineeringTask"
WHERE "id" IN ('dep-prerequisite','dep-dependent','dep-independent');

SELECT 'TASK_DEPENDENCY_CLAIM_INTEGRATION_PASS' AS result;
