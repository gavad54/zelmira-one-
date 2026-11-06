-- Initial VAYRO CORE schema.
-- RLS is enabled with no client policies: VAYRO uses its own server-side session model
-- and direct server-only database access. Public Data API access remains revoked.

CREATE TYPE public."PlatformRole" AS ENUM ('OWNER', 'PLATFORM_ADMIN', 'SUPPORT', 'USER');
CREATE TYPE public."TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');
CREATE TYPE public."MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER');
CREATE TYPE public."ProductStatus" AS ENUM ('PLANNED', 'ACTIVE', 'MAINTENANCE', 'RETIRED');
CREATE TYPE public."EmailPurpose" AS ENUM ('OWNER', 'SUPPORT', 'BILLING', 'SECURITY', 'GENERAL');
CREATE TYPE public."AuthTokenPurpose" AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET');

CREATE TABLE public."User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "platformRole" public."PlatformRole" NOT NULL DEFAULT 'USER',
  "emailVerifiedAt" TIMESTAMP(3),
  "disabledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE public."Tenant" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "status" public."TenantStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE public."Membership" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "role" public."MembershipRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Membership_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE public."Session" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE public."Product" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" public."ProductStatus" NOT NULL DEFAULT 'PLANNED',
  "baseUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE public."License" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "License_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "License_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "License_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE public."AuditEvent" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT,
  "tenantId" TEXT,
  "action" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "resourceId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES public."User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE public."EmailContact" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "purposes" public."EmailPurpose"[] NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailContact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE public."EmailContactVerificationToken" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailContactVerificationToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmailContactVerificationToken_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public."EmailContact"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE public."AuthActionToken" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purpose" public."AuthTokenPurpose" NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthActionToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuthActionToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE public."AuthRateLimit" (
  "keyHash" TEXT NOT NULL,
  "windowStartedAt" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("keyHash")
);

CREATE UNIQUE INDEX "User_email_key" ON public."User"("email");
CREATE UNIQUE INDEX "Tenant_slug_key" ON public."Tenant"("slug");
CREATE UNIQUE INDEX "Membership_userId_tenantId_key" ON public."Membership"("userId", "tenantId");
CREATE INDEX "Membership_tenantId_role_idx" ON public."Membership"("tenantId", "role");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON public."Session"("tokenHash");
CREATE INDEX "Session_userId_expiresAt_idx" ON public."Session"("userId", "expiresAt");
CREATE UNIQUE INDEX "Product_key_key" ON public."Product"("key");
CREATE INDEX "License_tenantId_active_idx" ON public."License"("tenantId", "active");
CREATE INDEX "License_productId_idx" ON public."License"("productId");
CREATE UNIQUE INDEX "License_tenantId_productId_key" ON public."License"("tenantId", "productId");
CREATE INDEX "AuditEvent_tenantId_createdAt_idx" ON public."AuditEvent"("tenantId", "createdAt");
CREATE INDEX "AuditEvent_actorUserId_createdAt_idx" ON public."AuditEvent"("actorUserId", "createdAt");
CREATE UNIQUE INDEX "EmailContact_email_key" ON public."EmailContact"("email");
CREATE INDEX "EmailContact_enabled_isPrimary_idx" ON public."EmailContact"("enabled", "isPrimary");
CREATE UNIQUE INDEX "EmailContactVerificationToken_tokenHash_key" ON public."EmailContactVerificationToken"("tokenHash");
CREATE INDEX "EmailContactVerificationToken_contactId_expiresAt_idx" ON public."EmailContactVerificationToken"("contactId", "expiresAt");
CREATE UNIQUE INDEX "AuthActionToken_tokenHash_key" ON public."AuthActionToken"("tokenHash");
CREATE INDEX "AuthActionToken_userId_purpose_expiresAt_idx" ON public."AuthActionToken"("userId", "purpose", "expiresAt");
CREATE INDEX "AuthRateLimit_expiresAt_idx" ON public."AuthRateLimit"("expiresAt");

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."License" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EmailContact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EmailContactVerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuthActionToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuthRateLimit" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;
