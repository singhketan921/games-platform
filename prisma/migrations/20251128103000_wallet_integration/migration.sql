-- CreateEnum
CREATE TYPE "WalletCallbackType" AS ENUM ('DEBIT', 'CREDIT', 'BALANCE');

-- CreateTable
CREATE TABLE "TenantWalletConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "debitUrl" TEXT NOT NULL,
    "creditUrl" TEXT NOT NULL,
    "balanceUrl" TEXT NOT NULL,
    "hmacSecret" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantWalletConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletCallbackLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "WalletCallbackType" NOT NULL,
    "endpoint" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "responseCode" INTEGER,
    "responseBody" TEXT,
    "status" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletCallbackLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantWalletConfig_tenantId_key" ON "TenantWalletConfig"("tenantId");

-- AddForeignKey
ALTER TABLE "TenantWalletConfig"
    ADD CONSTRAINT "TenantWalletConfig_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WalletCallbackLog"
    ADD CONSTRAINT "WalletCallbackLog_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
