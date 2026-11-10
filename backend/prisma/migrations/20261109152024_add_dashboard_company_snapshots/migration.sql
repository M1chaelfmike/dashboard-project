-- CreateTable
CREATE TABLE "dashboard_company_snapshots" (
    "id" UUID NOT NULL,
    "total_companies" INTEGER NOT NULL,
    "total_revenue" BIGINT NOT NULL,
    "total_countries" INTEGER NOT NULL,
    "total_employees" BIGINT NOT NULL,
    "captured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_company_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dashboard_company_snapshots_captured_at_idx" ON "dashboard_company_snapshots"("captured_at");
