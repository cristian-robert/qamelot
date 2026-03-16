-- AlterTable
ALTER TABLE "TestResult" ADD COLUMN "statusOverride" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TestStepResult" (
    "id" TEXT NOT NULL,
    "testResultId" TEXT NOT NULL,
    "testCaseStepId" TEXT NOT NULL,
    "status" "TestResultStatus" NOT NULL DEFAULT 'UNTESTED',
    "actualResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestStepResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestStepResult_testResultId_idx" ON "TestStepResult"("testResultId");

-- CreateIndex
CREATE INDEX "TestStepResult_testCaseStepId_idx" ON "TestStepResult"("testCaseStepId");

-- CreateIndex
CREATE UNIQUE INDEX "TestStepResult_testResultId_testCaseStepId_key" ON "TestStepResult"("testResultId", "testCaseStepId");

-- AddForeignKey
ALTER TABLE "TestStepResult" ADD CONSTRAINT "TestStepResult_testResultId_fkey" FOREIGN KEY ("testResultId") REFERENCES "TestResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestStepResult" ADD CONSTRAINT "TestStepResult_testCaseStepId_fkey" FOREIGN KEY ("testCaseStepId") REFERENCES "TestCaseStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
