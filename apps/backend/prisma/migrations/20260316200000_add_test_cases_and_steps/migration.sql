-- DropEnum (replace old Priority and TestCaseType enums with new names)
-- The old TestCase table used "Priority" and "TestCaseType" enums
-- which are being replaced by "CasePriority" and "CaseType" plus adding "TemplateType"

-- AlterTable: Drop the old columns and add new ones
-- First, drop the old "steps" JSONB column and "automationFlag" boolean
ALTER TABLE "TestCase" DROP COLUMN IF EXISTS "steps";
ALTER TABLE "TestCase" DROP COLUMN IF EXISTS "automationFlag";

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('FUNCTIONAL', 'REGRESSION', 'SMOKE', 'EXPLORATORY', 'OTHER');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('TEXT', 'STEPS');

-- Add new columns with defaults
ALTER TABLE "TestCase" ADD COLUMN "templateType" "TemplateType" NOT NULL DEFAULT 'TEXT';
ALTER TABLE "TestCase" ADD COLUMN "estimate" INTEGER;
ALTER TABLE "TestCase" ADD COLUMN "references" TEXT;
ALTER TABLE "TestCase" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- Migrate priority column from old "Priority" enum to new "CasePriority" enum
ALTER TABLE "TestCase" ALTER COLUMN "priority" TYPE "CasePriority" USING ("priority"::TEXT::"CasePriority");
ALTER TABLE "TestCase" ALTER COLUMN "priority" SET DEFAULT 'MEDIUM'::"CasePriority";

-- Migrate type column: old "TestCaseType" had ACCEPTANCE, new "CaseType" has OTHER
-- Map ACCEPTANCE -> OTHER before changing enum
UPDATE "TestCase" SET "type" = 'OTHER' WHERE "type"::TEXT = 'ACCEPTANCE';
ALTER TABLE "TestCase" ALTER COLUMN "type" TYPE "CaseType" USING ("type"::TEXT::"CaseType");
ALTER TABLE "TestCase" ALTER COLUMN "type" SET DEFAULT 'FUNCTIONAL'::"CaseType";

-- Drop old enums
DROP TYPE IF EXISTS "Priority";
DROP TYPE IF EXISTS "TestCaseType";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TestCase_priority_idx" ON "TestCase"("priority");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TestCase_type_idx" ON "TestCase"("type");

-- CreateTable
CREATE TABLE "TestCaseStep" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestCaseStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestCaseStep_caseId_idx" ON "TestCaseStep"("caseId");

-- CreateUnique
CREATE UNIQUE INDEX "TestCaseStep_caseId_stepNumber_key" ON "TestCaseStep"("caseId", "stepNumber");

-- AddForeignKey
ALTER TABLE "TestCaseStep" ADD CONSTRAINT "TestCaseStep_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "TestCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
