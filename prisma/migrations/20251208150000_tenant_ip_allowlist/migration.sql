-- CreateTable
CREATE TABLE "TenantIpAllowlist" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TenantIpAllowlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantIpAllowlist_tenantId_ipAddress_key" ON "TenantIpAllowlist"("tenantId", "ipAddress");
CREATE INDEX "tenant_ip_allowlist_tenant_idx" ON "TenantIpAllowlist"("tenantId");

-- AddForeignKey
ALTER TABLE "TenantIpAllowlist" ADD CONSTRAINT "TenantIpAllowlist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
