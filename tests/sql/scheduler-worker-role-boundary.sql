-- Isolated PostgreSQL CI only. Verifies the scheduler runtime can execute
-- only its SECURITY DEFINER functions and cannot access protected tables.
DO $$
BEGIN
  IF NOT pg_has_role(current_user, 'vayro_task_scheduler', 'MEMBER') THEN
    RAISE EXCEPTION 'SCHEDULER_ROLE_MEMBERSHIP_MISSING';
  END IF;
  IF NOT has_function_privilege(current_user, 'public.vayro_materialize_due_engineering_schedules(text,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'SCHEDULER_MATERIALIZER_EXECUTE_MISSING';
  END IF;
  IF NOT has_function_privilege(current_user, 'public.vayro_reconcile_goal_progress(integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'SCHEDULER_RECONCILE_EXECUTE_MISSING';
  END IF;
  IF has_table_privilege(current_user, 'public."RecurringSchedule"', 'SELECT')
     OR has_table_privilege(current_user, 'public."RecurringSchedule"', 'INSERT')
     OR has_table_privilege(current_user, 'public."EngineeringTask"', 'INSERT')
     OR has_table_privilege(current_user, 'public."GoalRecord"', 'SELECT')
     OR has_table_privilege(current_user, 'public."EngineeringAgent"', 'SELECT')
     OR has_table_privilege(current_user, 'public."TaskReview"', 'INSERT') THEN
    RAISE EXCEPTION 'SCHEDULER_HAS_DIRECT_TABLE_ACCESS';
  END IF;
  IF has_function_privilege(current_user, 'public.vayro_claim_engineering_task(text,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'SCHEDULER_CAN_CLAIM_TASKS';
  END IF;
END
$$;

SELECT public.vayro_materialize_due_engineering_schedules('ci-scheduler-role', 1) AS created;
SELECT public.vayro_reconcile_goal_progress(10) AS reconciled;
SELECT 'SCHEDULER_ROLE_BOUNDARY_PASS' AS result;