-- First-class tenant-scoped conversation history and archive metadata.
-- Message rows are append-only through the application role; archive and deletion
-- are soft state transitions on the parent conversation.
CREATE TABLE public."Conversation" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "title" VARCHAR(200),
  "archivedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Conversation_id_tenantId_key" UNIQUE ("id","tenantId"),
  CONSTRAINT "Conversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Conversation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES public."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Conversation_tenantId_archivedAt_updatedAt_idx" ON public."Conversation"("tenantId","archivedAt","updatedAt");
CREATE INDEX "Conversation_tenantId_createdByUserId_updatedAt_idx" ON public."Conversation"("tenantId","createdByUserId","updatedAt");

CREATE TABLE public."ConversationMessage" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderUserId" TEXT,
  "role" VARCHAR(16) NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "contentSha256" CHAR(64) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConversationMessage_id_tenantId_key" UNIQUE ("id","tenantId"),
  CONSTRAINT "ConversationMessage_role_check" CHECK ("role" IN ('USER','ASSISTANT','SYSTEM','TOOL')),
  CONSTRAINT "ConversationMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConversationMessage_conversation_tenant_fkey" FOREIGN KEY ("conversationId","tenantId") REFERENCES public."Conversation"("id","tenantId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConversationMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES public."User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ConversationMessage_tenantId_conversationId_createdAt_id_idx" ON public."ConversationMessage"("tenantId","conversationId","createdAt","id");
CREATE INDEX "ConversationMessage_tenantId_senderUserId_createdAt_idx" ON public."ConversationMessage"("tenantId","senderUserId","createdAt");

CREATE TABLE public."ConversationAttachment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "uploadedByUserId" TEXT NOT NULL,
  "objectKey" VARCHAR(512) NOT NULL,
  "fileName" VARCHAR(255) NOT NULL,
  "contentType" VARCHAR(160) NOT NULL,
  "byteSize" BIGINT NOT NULL,
  "sha256" CHAR(64) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ConversationAttachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConversationAttachment_objectKey_key" UNIQUE ("objectKey"),
  CONSTRAINT "ConversationAttachment_byteSize_check" CHECK ("byteSize" > 0),
  CONSTRAINT "ConversationAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConversationAttachment_message_tenant_fkey" FOREIGN KEY ("messageId","tenantId") REFERENCES public."ConversationMessage"("id","tenantId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConversationAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES public."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "ConversationAttachment_tenantId_messageId_createdAt_idx" ON public."ConversationAttachment"("tenantId","messageId","createdAt");
CREATE INDEX "ConversationAttachment_tenantId_deletedAt_idx" ON public."ConversationAttachment"("tenantId","deletedAt");

GRANT SELECT, INSERT, UPDATE ON public."Conversation" TO vayro_app;
GRANT SELECT, INSERT ON public."ConversationMessage" TO vayro_app;
GRANT SELECT, INSERT ON public."ConversationAttachment" TO vayro_app;

ALTER TABLE public."Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Conversation" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."ConversationMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ConversationMessage" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."ConversationAttachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ConversationAttachment" FORCE ROW LEVEL SECURITY;

CREATE POLICY vayro_app_conversation_read ON public."Conversation"
FOR SELECT TO vayro_app
USING (
  "tenantId" = NULLIF(current_setting('app.tenant_id', true), '')
  AND "deletedAt" IS NULL
  AND (
    "createdByUserId" = NULLIF(current_setting('app.user_id', true), '')
    OR NULLIF(current_setting('app.user_role', true), '') IN ('OWNER','ADMIN','MANAGER')
  )
);
CREATE POLICY vayro_app_conversation_insert ON public."Conversation"
FOR INSERT TO vayro_app
WITH CHECK (
  "tenantId" = NULLIF(current_setting('app.tenant_id', true), '')
  AND "createdByUserId" = NULLIF(current_setting('app.user_id', true), '')
);
CREATE POLICY vayro_app_conversation_update ON public."Conversation"
FOR UPDATE TO vayro_app
USING (
  "tenantId" = NULLIF(current_setting('app.tenant_id', true), '')
  AND "deletedAt" IS NULL
  AND (
    "createdByUserId" = NULLIF(current_setting('app.user_id', true), '')
    OR NULLIF(current_setting('app.user_role', true), '') IN ('OWNER','ADMIN','MANAGER')
  )
)
WITH CHECK (
  "tenantId" = NULLIF(current_setting('app.tenant_id', true), '')
  AND (
    "createdByUserId" = NULLIF(current_setting('app.user_id', true), '')
    OR NULLIF(current_setting('app.user_role', true), '') IN ('OWNER','ADMIN','MANAGER')
  )
);

CREATE POLICY vayro_app_conversation_message_read ON public."ConversationMessage"
FOR SELECT TO vayro_app
USING (
  "tenantId" = NULLIF(current_setting('app.tenant_id', true), '')
  AND EXISTS (
    SELECT 1 FROM public."Conversation" c
    WHERE c."id" = "ConversationMessage"."conversationId"
      AND c."tenantId" = "ConversationMessage"."tenantId"
      AND c."deletedAt" IS NULL
      AND (
        c."createdByUserId" = NULLIF(current_setting('app.user_id', true), '')
        OR NULLIF(current_setting('app.user_role', true), '') IN ('OWNER','ADMIN','MANAGER')
      )
  )
);
CREATE POLICY vayro_app_conversation_message_insert ON public."ConversationMessage"
FOR INSERT TO vayro_app
WITH CHECK (
  "tenantId" = NULLIF(current_setting('app.tenant_id', true), '')
  AND (
    ("role" = 'USER' AND "senderUserId" = NULLIF(current_setting('app.user_id', true), ''))
    OR ("role" IN ('ASSISTANT','SYSTEM','TOOL') AND "senderUserId" IS NULL)
  )
  AND EXISTS (
    SELECT 1 FROM public."Conversation" c
    WHERE c."id" = "ConversationMessage"."conversationId"
      AND c."tenantId" = "ConversationMessage"."tenantId"
      AND c."archivedAt" IS NULL
      AND c."deletedAt" IS NULL
      AND (
        c."createdByUserId" = NULLIF(current_setting('app.user_id', true), '')
        OR NULLIF(current_setting('app.user_role', true), '') IN ('OWNER','ADMIN','MANAGER')
      )
  )
);

CREATE POLICY vayro_app_conversation_attachment_read ON public."ConversationAttachment"
FOR SELECT TO vayro_app
USING (
  "tenantId" = NULLIF(current_setting('app.tenant_id', true), '')
  AND "deletedAt" IS NULL
  AND EXISTS (
    SELECT 1 FROM public."ConversationMessage" m
    JOIN public."Conversation" c
      ON c."id" = m."conversationId" AND c."tenantId" = m."tenantId"
    WHERE m."id" = "ConversationAttachment"."messageId"
      AND m."tenantId" = "ConversationAttachment"."tenantId"
      AND c."deletedAt" IS NULL
      AND (
        c."createdByUserId" = NULLIF(current_setting('app.user_id', true), '')
        OR NULLIF(current_setting('app.user_role', true), '') IN ('OWNER','ADMIN','MANAGER')
      )
  )
);
CREATE POLICY vayro_app_conversation_attachment_insert ON public."ConversationAttachment"
FOR INSERT TO vayro_app
WITH CHECK (
  "tenantId" = NULLIF(current_setting('app.tenant_id', true), '')
  AND "uploadedByUserId" = NULLIF(current_setting('app.user_id', true), '')
  AND "byteSize" > 0
  AND EXISTS (
    SELECT 1 FROM public."ConversationMessage" m
    JOIN public."Conversation" c
      ON c."id" = m."conversationId" AND c."tenantId" = m."tenantId"
    WHERE m."id" = "ConversationAttachment"."messageId"
      AND m."tenantId" = "ConversationAttachment"."tenantId"
      AND c."archivedAt" IS NULL
      AND c."deletedAt" IS NULL
      AND (
        c."createdByUserId" = NULLIF(current_setting('app.user_id', true), '')
        OR NULLIF(current_setting('app.user_role', true), '') IN ('OWNER','ADMIN','MANAGER')
      )
  )
);
