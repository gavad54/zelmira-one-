-- Owner API boundary for durable engineering tasks.
-- The owner platform role may enqueue and inspect tasks, but cannot mutate or delete them.
-- Worker attempts and task transitions remain behind SECURITY DEFINER functions.

ALTER TABLE public."EngineeringTask" ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON TABLE public."EngineeringTask" TO vayro_platform;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public."EngineeringTask" FROM vayro_platform;
REVOKE ALL ON TABLE public."EngineeringTaskAttempt" FROM vayro_platform;

CREATE POLICY vayro_task_owner_select
ON public."EngineeringTask"
FOR SELECT TO vayro_platform
USING (public.vayro_platform_actor_is_owner());

CREATE POLICY vayro_task_owner_insert
ON public."EngineeringTask"
FOR INSERT TO vayro_platform
WITH CHECK (public.vayro_platform_actor_is_owner());
