-- Durable, tenant-scoped AI generation records. No provider secrets or session tokens are stored.
CREATE TABLE public."AiGeneration" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "output" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiGeneration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AiGeneration_kind_check" CHECK ("kind" IN ('DANA_TEXT', 'NEGAH_IMAGE')),
  CONSTRAINT "AiGeneration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AiGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AiGeneration_tenantId_createdAt_idx" ON public."AiGeneration"("tenantId", "createdAt");
CREATE INDEX "AiGeneration_tenantId_userId_createdAt_idx" ON public."AiGeneration"("tenantId", "userId", "createdAt");
CREATE INDEX "AiGeneration_userId_createdAt_idx" ON public."AiGeneration"("userId", "createdAt");

GRANT SELECT, INSERT ON public."AiGeneration" TO vayro_app;
ALTER TABLE public."AiGeneration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AiGeneration" FORCE ROW LEVEL SECURITY;

CREATE POLICY vayro_app_ai_generation_read
ON public."AiGeneration" FOR SELECT TO vayro_app
USING (
  "tenantId" = NULLIF(current_setting('app.tenant_id', true), '')
  AND (
    "userId" = NULLIF(current_setting('app.user_id', true), '')
    OR NULLIF(current_setting('app.user_role', true), '') IN ('OWNER', 'ADMIN', 'MANAGER')
  )
);

CREATE POLICY vayro_app_ai_generation_insert
ON public."AiGeneration" FOR INSERT TO vayro_app
WITH CHECK (
  "tenantId" = NULLIF(current_setting('app.tenant_id', true), '')
  AND "userId" = NULLIF(current_setting('app.user_id', true), '')
  AND NULLIF(current_setting('app.user_role', true), '') IN ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
);
