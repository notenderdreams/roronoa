-- CreateEnum
CREATE TYPE "FoundStatus" AS ENUM ('PENDING_HANDOVER', 'IN_CUSTODY', 'RETURNED');

-- CreateTable
CREATE TABLE "found_report" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "foundAt" TIMESTAMP(3) NOT NULL,
    "imageKey" TEXT,
    "status" "FoundStatus" NOT NULL DEFAULT 'PENDING_HANDOVER',
    "finderId" TEXT NOT NULL,
    "handedOverAt" TIMESTAMP(3),
    "confirmedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "found_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_event" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "found_report_reportId_key" ON "found_report"("reportId");

-- CreateIndex
CREATE INDEX "found_report_status_idx" ON "found_report"("status");

-- CreateIndex
CREATE INDEX "found_report_finderId_idx" ON "found_report"("finderId");

-- CreateIndex
CREATE INDEX "found_report_confirmedById_idx" ON "found_report"("confirmedById");

-- CreateIndex
CREATE INDEX "audit_event_actorId_idx" ON "audit_event"("actorId");

-- CreateIndex
CREATE INDEX "audit_event_entityId_idx" ON "audit_event"("entityId");

-- AddForeignKey
ALTER TABLE "found_report" ADD CONSTRAINT "found_report_finderId_fkey" FOREIGN KEY ("finderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "found_report" ADD CONSTRAINT "found_report_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
