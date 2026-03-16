-- CreateEnum
CREATE TYPE "TestResultStatus" AS ENUM ('PASSED', 'FAILED', 'BLOCKED', 'RETEST', 'UNTESTED');

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL,
    "testRunCaseId" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "executedById" TEXT NOT NULL,
    "status" "TestResultStatus" NOT NULL DEFAULT 'UNTESTED',
    "comment" TEXT,
    "elapsed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestResult_testRunCaseId_idx" ON "TestResult"("testRunCaseId");

-- CreateIndex
CREATE INDEX "TestResult_testRunId_idx" ON "TestResult"("testRunId");

-- CreateIndex
CREATE INDEX "TestResult_executedById_idx" ON "TestResult"("executedById");

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_testRunCaseId_fkey" FOREIGN KEY ("testRunCaseId") REFERENCES "TestRunCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
