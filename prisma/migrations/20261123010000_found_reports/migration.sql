-- A PostgreSQL sequence guarantees unique, concurrency-safe public report numbers.
CREATE SEQUENCE "found_report_number_seq" START WITH 1 INCREMENT BY 1;

CREATE TYPE "FoundReportStatus" AS ENUM (
  'PENDING_HANDOVER',
  'IN_CUSTODY',
  'RETURNED'
);

CREATE TABLE "found_report" (
  "id" TEXT NOT NULL,
  "report_id" TEXT NOT NULL,
  "item_name" TEXT NOT NULL,
  "item_category" TEXT NOT NULL,
  "item_description" TEXT,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "location_label" TEXT,
  "found_at" TIMESTAMP(3) NOT NULL,
  "image_key" TEXT,
  "founder_id" TEXT NOT NULL,
  "status" "FoundReportStatus" NOT NULL DEFAULT 'PENDING_HANDOVER',
  "submission_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "found_report_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_event" (
  "id" TEXT NOT NULL,
  "actor_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "found_report_report_id_key" ON "found_report"("report_id");
CREATE INDEX "found_report_founder_id_submission_at_idx" ON "found_report"("founder_id", "submission_at");
CREATE INDEX "found_report_status_submission_at_idx" ON "found_report"("status", "submission_at");
CREATE INDEX "audit_event_entity_id_created_at_idx" ON "audit_event"("entity_id", "created_at");
CREATE INDEX "audit_event_actor_id_created_at_idx" ON "audit_event"("actor_id", "created_at");

ALTER TABLE "found_report"
  ADD CONSTRAINT "found_report_founder_id_fkey"
  FOREIGN KEY ("founder_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_event"
  ADD CONSTRAINT "audit_event_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
