-- Run after the durable task engine migration as a privileged CI-only verifier.
DO $$
DECLARE
  v_role RECORD;
BEGIN
  SELECT r.rolsuper, r.rolbypassrls, r.rolcanlogin
    INTO v_role FROM pg_roles r WHERE r.rolname = current_user;
  IF NOT FOUND OR v_role.rolsuper OR v_role.rolbypassrls OR NOT v_role.rolcanlogin THEN
    RAISE EXCEPTION 'TASK_WORKER_LOGIN_ROLE_UNSAFE';
  END IF;
  IF NOT pg_has_role(current_user, 'vayro_task_worker', 'USAGE') THEN
    RAISE EXCEPTION 'TASK_WORKER_FUNCTION_PRIVILEGES_NOT_INHERITED';
  END IF;
  IF has_table_privilege(current_user, 'public."EngineeringTask"', 'SELECT')
     OR has_table_privilege(current_user, 'public."EngineeringTask"', 'INSERT')
     OR has_table_privilege(current_user, 'public."EngineeringTask"', 'UPDATE')
     OR has_table_privilege(current_user, 'public."EngineeringTaskAttempt"', 'SELECT') THEN
    RAISE EXCEPTION 'TASK_WORKER_HAS_DIRECT_TABLE_ACCESS';
  END IF;
  IF has_table_privilege(current_user, 'public."EngineeringTaskDependency"', 'SELECT')
     OR has_table_privilege(current_user, 'public."EngineeringTaskDependency"', 'INSERT')
     OR has_table_privilege(current_user, 'public."EngineeringTaskDependency"', 'UPDATE')
     OR has_table_privilege(current_user, 'public."EngineeringTaskDependency"', 'DELETE') THEN
    RAISE EXCEPTION 'TASK_WORKER_HAS_DEPENDENCY_TABLE_ACCESS';
  END IF;
  IF has_function_privilege(current_user, 'public.vayro_add_engineering_task_dependency(text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'TASK_WORKER_CAN_MUTATE_DEPENDENCY_GRAPH';
  END IF;
  IF NOT has_function_privilege('vayro_platform', 'public.vayro_add_engineering_task_dependency(text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'OWNER_DEPENDENCY_FUNCTION_EXECUTE_MISSING';
  END IF;
  IF NOT has_function_privilege(current_user, 'public.vayro_claim_engineering_task(text,integer)', 'EXECUTE')
     OR NOT has_function_privilege(current_user, 'public.vayro_heartbeat_engineering_task(text,text,text,integer)', 'EXECUTE')
     OR NOT has_function_privilege(current_user, 'public.vayro_complete_engineering_task(text,text,text,jsonb)', 'EXECUTE')
     OR NOT has_function_privilege(current_user, 'public.vayro_fail_engineering_task(text,text,text,text,text,boolean)', 'EXECUTE') THEN
    RAISE EXCEPTION 'TASK_WORKER_FUNCTION_EXECUTE_MISSING';
  END IF;
END
$$;

DO $$
BEGIN
  RAISE NOTICE 'TASK_WORKER_ROLE_BOUNDARY_PASS';
END
$$;
