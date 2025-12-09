-- CreateTable
CREATE TABLE "GlobalRtpConfig" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "profile" "RtpProfile" NOT NULL DEFAULT 'MEDIUM',
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalRtpConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RtpChangeLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "tenantGameId" TEXT,
    "previousProfile" "RtpProfile",
    "newProfile" "RtpProfile" NOT NULL,
    "actor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RtpChangeLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RtpChangeLog"
    ADD CONSTRAINT "RtpChangeLog_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RtpChangeLog"
    ADD CONSTRAINT "RtpChangeLog_tenantGameId_fkey"
    FOREIGN KEY ("tenantGameId") REFERENCES "TenantGame"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
