-- AlterTable
ALTER TABLE "Game"
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "volatility" TEXT NOT NULL DEFAULT 'Medium',
ADD COLUMN     "rtp" DECIMAL(5, 2) NOT NULL DEFAULT 95.0;
