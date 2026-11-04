-- Baseline schema for fresh VAYRO databases.
-- Existing installations must verify their current schema and mark this baseline
-- as applied before running later migrations; never apply it over populated tables.
CREATE TYPE "PlatformRole" AS ENUM ('OWNER','PLATFORM_ADMIN','SUPPORT','USER');
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE','SUSPENDED','CLOSED');
CREATE TYPE "MembershipRole" AS ENUM ('OWNER','ADMIN','MANAGER','MEMBER','VIEWER');
CREATE TYPE "ProductStatus" AS ENUM ('PLANNED','ACTIVE','MAINTENANCE','RETIRED');
CREATE TYPE "EmailPurpose" AS ENUM ('OWNER','SUPPORT','BILLING','SECURITY','GENERAL');

CREATE TABLE "User" (
 "id" TEXT NOT NULL,"email" TEXT NOT NULL,"passwordHash" TEXT NOT NULL,"displayName" TEXT NOT NULL,
 "platformRole" "PlatformRole" NOT NULL DEFAULT 'USER',"emailVerifiedAt" TIMESTAMP(3),"disabledAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Tenant" (
 "id" TEXT NOT NULL,"name" TEXT NOT NULL,"slug" TEXT NOT NULL,"status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Membership" (
 "id" TEXT NOT NULL,"userId" TEXT NOT NULL,"tenantId" TEXT NOT NULL,
 "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Session" (
 "id" TEXT NOT NULL,"tokenHash" TEXT NOT NULL,"userId" TEXT NOT NULL,"expiresAt" TIMESTAMP(3) NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Product" (
 "id" TEXT NOT NULL,"key" TEXT NOT NULL,"name" TEXT NOT NULL,"description" TEXT NOT NULL,
 "status" "ProductStatus" NOT NULL DEFAULT 'PLANNED',"baseUrl" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "License" (
 "id" TEXT NOT NULL,"tenantId" TEXT NOT NULL,"productId" TEXT NOT NULL,"startsAt" TIMESTAMP(3) NOT NULL,
 "endsAt" TIMESTAMP(3),"active" BOOLEAN NOT NULL DEFAULT true,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AuditEvent" (
 "id" TEXT NOT NULL,"actorUserId" TEXT,"tenantId" TEXT,"action" TEXT NOT NULL,"resource" TEXT NOT NULL,
 "resourceId" TEXT,"metadata" JSONB,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmailContact" (
 "id" TEXT NOT NULL,"email" TEXT NOT NULL,"label" TEXT NOT NULL,"purposes" "EmailPurpose"[] NOT NULL,
 "enabled" BOOLEAN NOT NULL DEFAULT true,"isPrimary" BOOLEAN NOT NULL DEFAULT false,"verifiedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "EmailContact_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmailContactVerificationToken" (
 "id" TEXT NOT NULL,"tokenHash" TEXT NOT NULL,"contactId" TEXT NOT NULL,"expiresAt" TIMESTAMP(3) NOT NULL,
 "consumedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "EmailContactVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE UNIQUE INDEX "Membership_userId_tenantId_key" ON "Membership"("userId","tenantId");
CREATE INDEX "Membership_tenantId_role_idx" ON "Membership"("tenantId","role");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId","expiresAt");
CREATE UNIQUE INDEX "Product_key_key" ON "Product"("key");
CREATE INDEX "License_tenantId_active_idx" ON "License"("tenantId","active");
CREATE UNIQUE INDEX "License_tenantId_productId_key" ON "License"("tenantId","productId");
CREATE INDEX "AuditEvent_tenantId_createdAt_idx" ON "AuditEvent"("tenantId","createdAt");
CREATE INDEX "AuditEvent_actorUserId_createdAt_idx" ON "AuditEvent"("actorUserId","createdAt");
CREATE INDEX "EmailContact_enabled_isPrimary_idx" ON "EmailContact"("enabled","isPrimary");
CREATE UNIQUE INDEX "EmailContactVerificationToken_tokenHash_key" ON "EmailContactVerificationToken"("tokenHash");
CREATE INDEX "EmailContactVerificationToken_contactId_expiresAt_idx" ON "EmailContactVerificationToken"("contactId","expiresAt");

ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "License" ADD CONSTRAINT "License_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "License" ADD CONSTRAINT "License_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailContactVerificationToken" ADD CONSTRAINT "EmailContactVerificationToken_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "EmailContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
