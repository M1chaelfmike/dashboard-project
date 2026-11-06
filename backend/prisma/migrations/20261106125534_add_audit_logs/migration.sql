-- Create audit log category enum
CREATE TYPE "audit_log_category" AS ENUM (
    'BUSINESS_ACTIVITY',
    'AUTHENTICATION',
    'SECURITY_EVENT',
    'DATA_ACCESS'
);

-- Create audit log result enum
CREATE TYPE "audit_log_result" AS ENUM (
    'SUCCESS',
    'FAILURE'
);

-- Create audit logs table
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "category" "audit_log_category" NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "result" "audit_log_result" NOT NULL,

    "actor_id" VARCHAR(64),
    "actor_name" VARCHAR(100),

    "target_type" VARCHAR(50),
    "target_id" VARCHAR(128),
    "target_name" VARCHAR(255),

    "metadata" JSONB,
    "ip_address" VARCHAR(45),

    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Dashboard query index
CREATE INDEX "audit_logs_category_result_created_at_idx"
ON "audit_logs" ("category", "result", "created_at" DESC);

-- Operator history index
CREATE INDEX "audit_logs_actor_created_at_idx"
ON "audit_logs" ("actor_id", "created_at" DESC);

-- Target resource history index
CREATE INDEX "audit_logs_target_created_at_idx"
ON "audit_logs" ("target_type", "target_id", "created_at" DESC);