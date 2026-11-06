-- CreateTable
CREATE TABLE "companies" (
    "company_code" VARCHAR(32) NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "level" INTEGER NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "founded_year" INTEGER NOT NULL,
    "annual_revenue" INTEGER NOT NULL,
    "employees" INTEGER NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("company_code")
);

-- CreateTable
CREATE TABLE "company_relationships" (
    "company_code" VARCHAR(32) NOT NULL,
    "parent_company" VARCHAR(32),

    CONSTRAINT "company_relationships_pkey" PRIMARY KEY ("company_code")
);

-- CreateIndex
CREATE INDEX "companies_level_idx" ON "companies"("level");

-- CreateIndex
CREATE INDEX "companies_name_trgm_idx" ON "companies" USING GIN ("company_name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "company_relationships_parent_idx" ON "company_relationships"("parent_company");

-- AddForeignKey
ALTER TABLE "company_relationships" ADD CONSTRAINT "company_relationships_company_code_fkey" FOREIGN KEY ("company_code") REFERENCES "companies"("company_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_relationships" ADD CONSTRAINT "company_relationships_parent_company_fkey" FOREIGN KEY ("parent_company") REFERENCES "companies"("company_code") ON DELETE RESTRICT ON UPDATE CASCADE;
