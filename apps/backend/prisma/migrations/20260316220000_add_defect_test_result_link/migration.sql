-- AlterTable
ALTER TABLE "Defect" ADD COLUMN "testResultId" TEXT;

-- CreateIndex
CREATE INDEX "Defect_testResultId_idx" ON "Defect"("testResultId");

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_testResultId_fkey" FOREIGN KEY ("testResultId") REFERENCES "TestResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;
