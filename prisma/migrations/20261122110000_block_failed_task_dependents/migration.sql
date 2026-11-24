-- Automatically block every queued descendant when a prerequisite reaches a
-- terminal failure state. This covers worker failures, exhausted leases and
-- expired deadlines without relying on a scheduler to discover the condition.

CREATE OR REPLACE FUNCTION public.vayro_block_dependents_on_terminal_failure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW."status" IN ('FAILED', 'EXPIRED', 'DEAD_LETTER')
     AND OLD."status" IS DISTINCT FROM NEW."status" THEN
    WITH RECURSIVE affected("taskId") AS (
      SELECT dependency."taskId"
      FROM public."EngineeringTaskDependency" dependency
      WHERE dependency."dependsOnTaskId" = NEW."id"

      UNION

      SELECT dependency."taskId"
      FROM public."EngineeringTaskDependency" dependency
      JOIN affected parent ON dependency."dependsOnTaskId" = parent."taskId"
    )
    UPDATE public."EngineeringTask" task
    SET "status" = 'BLOCKED',
        "lastErrorCode" = 'DEPENDENCY_FAILED',
        "lastErrorMessage" = 'A prerequisite task reached a terminal failure state',
        "completedAt" = clock_timestamp(),
        "updatedAt" = clock_timestamp(),
        "leaseOwner" = NULL,
        "leaseToken" = NULL,
        "leaseExpiresAt" = NULL,
        "heartbeatAt" = NULL
    WHERE task."id" IN (SELECT "taskId" FROM affected)
      AND task."status" IN ('DRAFT', 'QUEUED', 'RETRYING', 'WAITING_APPROVAL', 'WAITING_FOR_OWNER');
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.vayro_block_dependents_on_terminal_failure() FROM PUBLIC;

CREATE TRIGGER "EngineeringTask_block_dependents_after_terminal_failure"
AFTER UPDATE OF "status" ON public."EngineeringTask"
FOR EACH ROW
EXECUTE FUNCTION public.vayro_block_dependents_on_terminal_failure();
