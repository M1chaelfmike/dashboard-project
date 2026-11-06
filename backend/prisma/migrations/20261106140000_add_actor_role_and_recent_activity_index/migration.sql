-- Add actor role snapshot to audit logs
ALTER TABLE "audit_logs"
ADD COLUMN "actor_role" VARCHAR(20);

-- Optimize recent business activity queries
CREATE INDEX "audit_logs_category_created_at_idx"
ON "audit_logs" ("category", "created_at" DESC);