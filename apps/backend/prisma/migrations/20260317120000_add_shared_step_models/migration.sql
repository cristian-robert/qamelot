-- CreateTable
CREATE TABLE "SharedStep" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedStepItem" (
    "id" TEXT NOT NULL,
    "sharedStepId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedStepItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SharedStep_projectId_idx" ON "SharedStep"("projectId");

-- CreateIndex
CREATE INDEX "SharedStepItem_sharedStepId_idx" ON "SharedStepItem"("sharedStepId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedStepItem_sharedStepId_stepNumber_key" ON "SharedStepItem"("sharedStepId", "stepNumber");

-- AddForeignKey
ALTER TABLE "SharedStep" ADD CONSTRAINT "SharedStep_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedStepItem" ADD CONSTRAINT "SharedStepItem_sharedStepId_fkey" FOREIGN KEY ("sharedStepId") REFERENCES "SharedStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
