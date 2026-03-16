-- DropForeignKey
ALTER TABLE "TestRunCase" DROP CONSTRAINT "TestRunCase_suiteId_fkey";

-- DropIndex
DROP INDEX "TestRunCase_suiteId_idx";

-- DropIndex
DROP INDEX "TestRunCase_testRunId_suiteId_key";

-- Remove old column and add new one
ALTER TABLE "TestRunCase" DROP COLUMN "suiteId";
ALTER TABLE "TestRunCase" ADD COLUMN "testCaseId" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "TestRunCase_testCaseId_idx" ON "TestRunCase"("testCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "TestRunCase_testRunId_testCaseId_key" ON "TestRunCase"("testRunId", "testCaseId");

-- AddForeignKey
ALTER TABLE "TestRunCase" ADD CONSTRAINT "TestRunCase_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remove default
ALTER TABLE "TestRunCase" ALTER COLUMN "testCaseId" DROP DEFAULT;
