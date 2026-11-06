
import 'dotenv/config';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'csv-parse/sync';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

type CompanyCsv = {
  company_code: string;
  company_name: string;
  level: string;
  country: string;
  city: string;
  founded_year: string;
  annual_revenue: string;
  employees: string;
};

type RelationshipCsv = {
  company_code: string;
  parent_company: string;
};

function loadCsv<T>(fileName: string): T[] {
  const filePath = join(
    process.cwd(),
    'prisma',
    'data',
    fileName,
  );

  const content = readFileSync(filePath, 'utf8');

  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as T[];
}

function toInteger(value: string, field: string): number {
  const result = Number(value);

  if (!Number.isSafeInteger(result)) {
    throw new Error(`Invalid integer in ${field}: ${value}`);
  }

  return result;
}

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL is missing.');
  }

  const adapter = new PrismaPg({
    connectionString: url,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    // Step 1: Load companies.
    const companies = loadCsv<CompanyCsv>(
      'companies_1008.csv',
    ).map((row) => ({
      companyCode: row.company_code,
      companyName: row.company_name,
      level: toInteger(row.level, 'level'),
      country: row.country,
      city: row.city,
      foundedYear: toInteger(row.founded_year, 'founded_year'),
      annualRevenue: toInteger(row.annual_revenue, 'annual_revenue'),
      employees: toInteger(row.employees, 'employees'),
    }));

    // Step 2: Load relationships.
    const relationships = loadCsv<RelationshipCsv>(
      'relationships_1008.csv',
    ).map((row) => ({
      companyCode: row.company_code,
      parentCompanyCode: row.parent_company || null,
    }));

    // Step 3: Validate references.
    const codes = new Set(
      companies.map((company) => company.companyCode),
    );

    if (codes.size !== companies.length) {
      throw new Error('Duplicate company codes found.');
    }

    if (relationships.length !== companies.length) {
      throw new Error('Company and relationship counts do not match.');
    }

    const relationshipCodes = new Set(
      relationships.map((row) => row.companyCode),
    );

    if (
      relationshipCodes.size !== relationships.length ||
      relationshipCodes.size !== codes.size ||
      [...codes].some((code) => !relationshipCodes.has(code))
    ) {
      throw new Error('Relationship company codes do not match.');
    }

    for (const row of relationships) {
      if (
        !codes.has(row.companyCode) ||
        (row.parentCompanyCode &&
          !codes.has(row.parentCompanyCode))
      ) {
        throw new Error(
          `Invalid relationship: ${row.companyCode}`,
        );
      }
    }

    console.log(`Loaded ${companies.length} companies.`);
    console.log(`Loaded ${relationships.length} relationships.`);

    // Step 4: Import in a transaction.
    // Companies must be inserted before relationships.
    await prisma.$transaction(
      async (tx) => {
        const batchSize = 400;

        for (let i = 0; i < companies.length; i += batchSize) {
          await tx.company.createMany({
            data: companies.slice(i, i + batchSize),
            skipDuplicates: true,
          });
        }

        for (
          let i = 0;
          i < relationships.length;
          i += batchSize
        ) {
          await tx.companyRelationship.createMany({
            data: relationships.slice(i, i + batchSize),
            skipDuplicates: true,
          });
        }
      },
      { timeout: 120000 },
    );

    // Step 5: Verify final counts.
    const companyCount = await prisma.company.count();
    const relationshipCount =
      await prisma.companyRelationship.count();

    console.log('Seed completed successfully.');
    console.log({
      companyCount,
      relationshipCount,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
