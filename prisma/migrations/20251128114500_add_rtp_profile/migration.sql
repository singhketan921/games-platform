-- CreateEnum
CREATE TYPE "RtpProfile" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "TenantGame"
ADD COLUMN     "rtpProfile" "RtpProfile" NOT NULL DEFAULT 'MEDIUM';

-- CreateIndex
CREATE UNIQUE INDEX "tenantId_gameId" ON "TenantGame"("tenantId", "gameId");
