-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "domain" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';
