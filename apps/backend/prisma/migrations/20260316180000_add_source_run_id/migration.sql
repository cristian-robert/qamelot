-- AlterTable
ALTER TABLE "TestRun" ADD COLUMN "sourceRunId" TEXT;

-- CreateIndex
CREATE INDEX "TestRun_sourceRunId_idx" ON "TestRun"("sourceRunId");

-- AddForeignKey
ALTER TABLE "TestRun" ADD CONSTRAINT "TestRun_sourceRunId_fkey" FOREIGN KEY ("sourceRunId") REFERENCES "TestRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
