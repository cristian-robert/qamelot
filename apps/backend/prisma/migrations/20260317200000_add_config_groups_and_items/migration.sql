-- AlterTable
ALTER TABLE "TestRun" ADD COLUMN "configLabel" TEXT;

-- CreateTable
CREATE TABLE "ConfigGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConfigGroup_projectId_idx" ON "ConfigGroup"("projectId");

-- CreateIndex
CREATE INDEX "ConfigItem_groupId_idx" ON "ConfigItem"("groupId");

-- AddForeignKey
ALTER TABLE "ConfigGroup" ADD CONSTRAINT "ConfigGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigItem" ADD CONSTRAINT "ConfigItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ConfigGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
