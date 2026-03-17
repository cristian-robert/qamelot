-- CreateEnum
CREATE TYPE "AutomationStatus" AS ENUM ('NOT_AUTOMATED', 'AUTOMATED', 'NEEDS_UPDATE');

-- CreateEnum
CREATE TYPE "ExecutionType" AS ENUM ('MANUAL', 'AUTOMATED');

-- AlterTable
ALTER TABLE "TestCase" ADD COLUMN     "automationFilePath" TEXT,
ADD COLUMN     "automationId" TEXT,
ADD COLUMN     "automationStatus" "AutomationStatus" NOT NULL DEFAULT 'NOT_AUTOMATED';

-- AlterTable
ALTER TABLE "TestResult" ADD COLUMN     "automationLog" TEXT;

-- AlterTable
ALTER TABLE "TestRun" ADD COLUMN     "ciJobUrl" TEXT,
ADD COLUMN     "executionType" "ExecutionType" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_projectId_idx" ON "ApiKey"("projectId");

-- CreateIndex
CREATE INDEX "TestCase_automationStatus_idx" ON "TestCase"("automationStatus");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
