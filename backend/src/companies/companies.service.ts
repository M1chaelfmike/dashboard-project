
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
  HttpException,
  Logger,
} from '@nestjs/common';

import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import type { AuditActorContext } from '../audit-logs/audit-logs.service.js';

import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListCompaniesQueryDto } from './dto/list-companies-query.dto.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(
    CompaniesService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private async withCompanyTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      // All company writers share this transaction-scoped lock across processes.
      // Acquire it before any company reads or row locks; subsequent statements
      // then see the previous writer's committed changes under ReadCommitted.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(1818326126, 1)`;
      return operation(tx);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  }


    /**
     * Record a company KPI snapshot within the current transaction.
     *
     * A snapshot is written only when the summary values change.
     * No separate transaction or database connection is created.
     */
    private async captureCompanySnapshot(
      tx: Prisma.TransactionClient,
    ): Promise<void> {
      // 1. Calculate the four KPI values
      const totals = await tx.company.aggregate({
        _count: {
          _all: true,
        },
        _sum: {
          annualRevenue: true,
          employees: true,
        },
      });

      const countries = await tx.company.groupBy({
        by: ['country'],
      });

      const normalizedCountries = new Set(
        countries
          .map((item) => item.country.trim().toLowerCase())
          .filter((country) => country.length > 0),
      );

      const current = {
        totalCompanies: totals._count._all,
        totalRevenue: BigInt(totals._sum.annualRevenue ?? 0),
        totalCountries: normalizedCountries.size,
        totalEmployees: BigInt(totals._sum.employees ?? 0),
      };

      // 2. Get the latest snapshot
      const previous =
        await tx.dashboardCompanySnapshot.findFirst({
          orderBy: [
            { capturedAt: 'desc' },
            { id: 'desc' },
          ],
        });

      // 3. Skip unchanged KPI values
      if (
        previous &&
        previous.totalCompanies === current.totalCompanies &&
        previous.totalRevenue === current.totalRevenue &&
        previous.totalCountries === current.totalCountries &&
        previous.totalEmployees === current.totalEmployees
      ) {
        return;
      }

      // Transaction start time can precede a writer that committed before us.
      // Use the database clock and advance beyond existing history at the same
      // millisecond precision returned by Prisma, including old microseconds.
      const [timestamp] = await tx.$queryRaw<Array<{ capturedAt: Date }>>`
        SELECT GREATEST(
          date_trunc('milliseconds', clock_timestamp()),
          COALESCE(
            date_trunc('milliseconds', MAX(captured_at)) + INTERVAL '1 millisecond',
            '-infinity'::timestamptz
          )
        ) AS "capturedAt"
        FROM dashboard_company_snapshots
      `;

      // 4. Persist the new snapshot
      await tx.dashboardCompanySnapshot.create({
        data: { ...current, capturedAt: timestamp.capturedAt },
      });
    }


  /**
   * Record failed company operations independently.
   * Failure audit must not replace the original business error.
   */
  private async recordFailure(
    action: string,
    context: AuditActorContext,
    targetId: string | null,
    targetName: string | null,
    error: unknown,
  ): Promise<void> {
    try {
      await this.auditLogsService.record({
        category: 'BUSINESS_ACTIVITY',
        action,
        result: 'FAILURE',

        actorId: context.actorId,
        actorName: context.actorName,
        actorRole: context.actorRole,

        targetType: 'COMPANY',
        targetId,
        targetName,

        metadata: {
          errorType:
            error instanceof Error
              ? error.name
              : 'UnknownError',

          ...(error instanceof HttpException
            ? { httpStatus: error.getStatus() }
            : {}),

          ...(error instanceof Prisma.PrismaClientKnownRequestError
            ? { prismaCode: error.code }
            : {}),
        },

        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    } catch (auditError: unknown) {
      this.logger.error(
        'Failed to persist company failure audit log.',
        auditError instanceof Error
          ? auditError.stack
          : String(auditError),
      );
    }
  }

  // Keep findAll() and findOne() unchanged below.


  async findAll(query: ListCompaniesQueryDto) {
    // 1. Parse pagination
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize
      ? Number(query.pageSize)
      : 20;

    if (
      !Number.isSafeInteger(page) ||
      !Number.isSafeInteger(pageSize) ||
      page < 1 ||
      pageSize < 1 ||
      pageSize > 100 ||
      !Number.isSafeInteger((page - 1) * pageSize)
    ) {
      throw new BadRequestException(
        'Invalid pagination parameters.',
      );
    }

    // 2. Parse search keyword
    const search = query.search?.trim() ?? '';

    // 3. Parse selected levels
    const levels = query.levels
      ? [...new Set(
          query.levels.split(',').map(Number),
        )]
      : [];

    // 4. Construct Prisma filters
    const where: Prisma.CompanyWhereInput = {
      ...(search
        ? {
            companyName: {
              contains: search,
              mode: 'insensitive' as const,
            },
          }
        : {}),

      ...(levels.length > 0
        ? {
            level: {
              in: levels,
            },
          }
        : {}),
    };

    // 5. Query total and paginated records
    const [total, companies] =
      await this.prisma.$transaction([
        this.prisma.company.count({
          where,
        }),

        this.prisma.company.findMany({
          where,
          orderBy: [
            { level: 'asc' },
            { companyCode: 'asc' },
          ],
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            companyCode: true,
            companyName: true,
            level: true,
            country: true,
            city: true,
            foundedYear: true,
            annualRevenue: true,
            employees: true,
            ownRelationship: {
              select: {
                parentCompanyCode: true,
                parentCompany: {
                  select: {
                    companyName: true,
                    level: true,
                  },
                },
              },
            },
          },
        }),
      ]);

    // 6. Calculate revenue efficiency
    const items = companies.map(
      ({ ownRelationship, ...company }) => ({
        ...company,

        parentCompanyCode:
          ownRelationship?.parentCompanyCode ?? null,

        parentCompanyName:
          ownRelationship?.parentCompany?.companyName ?? null,

        parentCompanyLevel:
          ownRelationship?.parentCompany?.level ?? null,
        revenueEfficiency:
          company.employees > 0
            ? Number(
                (
                  company.annualRevenue /
                  company.employees
                ).toFixed(2),
              )
            : null,
      }),
    );

    // 7. Return paginated response
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(companyCode: string) {
    const company = await this.prisma.company.findUnique({
      where: { companyCode },
      select: {
        companyCode: true,
        companyName: true,
        level: true,
        country: true,
        city: true,
        foundedYear: true,
        annualRevenue: true,
        employees: true,
        ownRelationship: {
          select: {
            parentCompanyCode: true,
            parentCompany: {
              select: {
                companyName: true,
                level: true,
              },
            },
          },
        },
      },
    });

    if(!company){
        throw new NotFoundException(
            `Company with code ${companyCode} not found.`,
        );
    }
    const {
        ownRelationship,
        ...companyData
    } = company;

    return {
        ...companyData,
        parentCompanyCode:
            ownRelationship?.parentCompanyCode ?? null,

        parentCompanyName:
          ownRelationship?.parentCompany?.companyName ?? null,

        parentCompanyLevel:
          ownRelationship?.parentCompany?.level ?? null,

        revenueEfficiency:
            company.employees > 0
            ? Number(
                (
                    company.annualRevenue /
                    company.employees
                ).toFixed(2)
            )
            : null,
    };
  }


  async create(
    dto: CreateCompanyDto,
    context: AuditActorContext,
  ) {
    try {
      if (dto.companyCode === dto.parentCompanyCode) {
        throw new BadRequestException(
          'A company cannot be its own parent.',
        );
      }

      const company = await this.withCompanyTransaction(
        async (tx) => {
          // 1. Check duplicate company code
          const existing = await tx.company.findUnique({
            where: {
              companyCode: dto.companyCode,
            },
          });

          if (existing) {
            throw new ConflictException(
              'Company code already exists.',
            );
          }

          // 2. Check parent company
          const parent = await tx.company.findUnique({
            where: {
              companyCode: dto.parentCompanyCode,
            },
            select: {
              companyCode: true,
              companyName: true,
              level: true,
            },
          });

          if (!parent) {
            throw new NotFoundException(
              'Parent company not found.',
            );
          }

          // 3. Validate hierarchy
          if (parent.level !== dto.level - 1) {
            throw new BadRequestException(
              'Company level must be one greater than its parent level.',
            );
          }

          // 4. Create company
          const created = await tx.company.create({
            data: {
              companyCode: dto.companyCode,
              companyName: dto.companyName.trim(),
              level: dto.level,
              country: dto.country.trim(),
              city: dto.city.trim(),
              foundedYear: dto.foundedYear,
              annualRevenue: dto.annualRevenue,
              employees: dto.employees,
            },
          });

          // 5. Create relationship
          await tx.companyRelationship.create({
            data: {
              companyCode: created.companyCode,
              parentCompanyCode: dto.parentCompanyCode,
            },
          });

          // 6. Write audit log in the same transaction
          await this.auditLogsService.record(
            {
              category: 'BUSINESS_ACTIVITY',
              action: 'CREATE_COMPANY',
              result: 'SUCCESS',

              actorId: context.actorId,
              actorName: context.actorName,
              actorRole: context.actorRole,

              targetType: 'COMPANY',
              targetId: created.companyCode,
              targetName: created.companyName,

              metadata: {
                after: {
                  companyCode: created.companyCode,
                  companyName: created.companyName,
                  level: created.level,
                  parentCompanyCode: dto.parentCompanyCode,
                  country: created.country,
                  city: created.city,
                  foundedYear: created.foundedYear,
                  annualRevenue: created.annualRevenue,
                  employees: created.employees,
                },
              },

              ipAddress: context.ipAddress,
              userAgent: context.userAgent,
            },
            tx,
          );

          await this.captureCompanySnapshot(tx);

          return created;
        },
      );

      return {
        ...company,
        parentCompanyCode: dto.parentCompanyCode,
        revenueEfficiency:
          company.employees > 0
            ? Number(
                (
                  company.annualRevenue /
                  company.employees
                ).toFixed(2),
              )
            : null,
      };
    } catch (error: unknown) {
      await this.recordFailure(
        'CREATE_COMPANY',
        context,
        dto.companyCode ?? null,
        dto.companyName ?? null,
        error,
      );

      if (
        error instanceof Prisma.PrismaClientKnownRequestError
      ) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Company code already exists.',
          );
        }

        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Invalid company relationship.',
          );
        }
      }

      throw error;
    }
  }




  async update(
    companyCode: string,
    dto: UpdateCompanyDto,
    context: AuditActorContext,
  ) {
    try {
      const hasAtLeastOneField = Object.values(dto).some(
        (value) => value !== undefined,
      );

      if (!hasAtLeastOneField) {
        throw new BadRequestException(
          'At least one field must be provided.',
        );
      }

      return await this.withCompanyTransaction(async (tx) => {
        // 1. Find existing company and relationship
        const current = await tx.company.findUnique({
          where: { companyCode },
          select: {
            companyCode: true,
            companyName: true,
            level: true,
            country: true,
            city: true,
            foundedYear: true,
            annualRevenue: true,
            employees: true,
            ownRelationship: {
              select: {
                parentCompanyCode: true,
              },
            },
          },
        });

        if (!current) {
          throw new NotFoundException(
            `Company ${companyCode} not found.`,
          );
        }

        const nextLevel = dto.level ?? current.level;

        const currentParent =
          current.ownRelationship?.parentCompanyCode ?? null;

        // 2. Protect root company
        if (
          current.level === 1 &&
          (
            dto.level !== undefined ||
            dto.parentCompanyCode !== undefined
          )
        ) {
          throw new BadRequestException(
            'Root company hierarchy cannot be modified.',
          );
        }

        if (
          current.level !== 1 &&
          !current.ownRelationship
        ) {
          throw new ConflictException(
            'Company relationship is missing.',
          );
        }

        // 3. Prevent self-parenting
        if (dto.parentCompanyCode === companyCode) {
          throw new BadRequestException(
            'A company cannot be its own parent.',
          );
        }

        // 4. Level changes are allowed only for leaf companies
        if (nextLevel !== current.level) {
          const childCount =
            await tx.companyRelationship.count({
              where: {
                parentCompanyCode: companyCode,
              },
            });

          if (childCount > 0) {
            throw new ConflictException(
              'Cannot change level while the company has children.',
            );
          }
        }

        const nextParent =
          dto.parentCompanyCode ?? currentParent;

        // 5. Validate new or existing parent
        if (nextLevel > 1) {
          if (!nextParent) {
            throw new BadRequestException(
              'A parent company is required.',
            );
          }

          if (nextParent === companyCode) {
            throw new BadRequestException(
              'A company cannot be its own parent.',
            );
          }

          const parent = await tx.company.findUnique({
            where: {
              companyCode: nextParent,
            },
            select: {
              level: true,
            },
          });

          if (!parent) {
            throw new NotFoundException(
              'Parent company not found.',
            );
          }

          if (parent.level !== nextLevel - 1) {
            throw new BadRequestException(
              'Company level must be one greater than its parent level.',
            );
          }
        }

        // 6. Update company information
        const updated = await tx.company.update({
          where: {
            companyCode,
          },
          data: {
            ...(dto.companyName !== undefined
              ? { companyName: dto.companyName.trim() }
              : {}),

            ...(dto.level !== undefined
              ? { level: dto.level }
              : {}),

            ...(dto.country !== undefined
              ? { country: dto.country.trim() }
              : {}),

            ...(dto.city !== undefined
              ? { city: dto.city.trim() }
              : {}),

            ...(dto.foundedYear !== undefined
              ? { foundedYear: dto.foundedYear }
              : {}),

            ...(dto.annualRevenue !== undefined
              ? { annualRevenue: dto.annualRevenue }
              : {}),

            ...(dto.employees !== undefined
              ? { employees: dto.employees }
              : {}),
          },
        });

        // 7. Update relationship only when parent changes
        if (
          current.level !== 1 &&
          dto.parentCompanyCode !== undefined &&
          dto.parentCompanyCode !== currentParent
        ) {
          await tx.companyRelationship.update({
            where: {
              companyCode,
            },
            data: {
              parentCompanyCode: dto.parentCompanyCode,
            },
          });
        }

        // 8. Build audit snapshots
        const before = {
          companyCode: current.companyCode,
          companyName: current.companyName,
          level: current.level,
          parentCompanyCode: currentParent,
          country: current.country,
          city: current.city,
          foundedYear: current.foundedYear,
          annualRevenue: current.annualRevenue,
          employees: current.employees,
        };

        const after = {
          companyCode: updated.companyCode,
          companyName: updated.companyName,
          level: updated.level,
          parentCompanyCode: nextParent,
          country: updated.country,
          city: updated.city,
          foundedYear: updated.foundedYear,
          annualRevenue: updated.annualRevenue,
          employees: updated.employees,
        };

        const changedFields = Object.keys(before).filter(
          (field) =>
            JSON.stringify(
              before[field as keyof typeof before],
            ) !==
            JSON.stringify(
              after[field as keyof typeof after],
            ),
        );

        // 9. Write audit log in the same transaction
        await this.auditLogsService.record(
          {
            category: 'BUSINESS_ACTIVITY',
            action: 'UPDATE_COMPANY',
            result: 'SUCCESS',

            actorId: context.actorId,
            actorName: context.actorName,
            actorRole: context.actorRole,

            targetType: 'COMPANY',
            targetId: updated.companyCode,
            targetName: updated.companyName,

            metadata: {
              before,
              after,
              changedFields,
            },

            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
          },
          tx,
        );

        // Capture KPI changes after updating the company
        await this.captureCompanySnapshot(tx);

        // 10. Return existing response structure
        return {
          ...updated,
          parentCompanyCode: nextParent,
          revenueEfficiency:
            updated.employees > 0
              ? Number(
                  (
                    updated.annualRevenue /
                    updated.employees
                  ).toFixed(2),
                )
              : null,
        };
      });
    } catch (error: unknown) {
      await this.recordFailure(
        'UPDATE_COMPANY',
        context,
        companyCode,
        companyCode,
        error,
      );

      if (
        error instanceof Prisma.PrismaClientKnownRequestError
      ) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            'Company or relationship no longer exists.',
          );
        }

        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Invalid company relationship.',
          );
        }
      }

      throw error;
    }
  }



  async remove(
    companyCode: string,
    context: AuditActorContext,
  ) {
    try {
      return await this.withCompanyTransaction(async (tx) => {
        // 1. Get company snapshot before deletion
        const company = await tx.company.findUnique({
          where: { companyCode },
          select: {
            companyCode: true,
            companyName: true,
            level: true,
            country: true,
            city: true,
            foundedYear: true,
            annualRevenue: true,
            employees: true,
            ownRelationship: {
              select: {
                parentCompanyCode: true,
              },
            },
          },
        });

        if (!company) {
          throw new NotFoundException(
            `Company ${companyCode} not found.`,
          );
        }

        if (company.level === 1) {
          throw new BadRequestException(
            'Root company cannot be deleted.',
          );
        }

        // 2. Prevent deleting companies with children
        const childCount =
          await tx.companyRelationship.count({
            where: {
              parentCompanyCode: companyCode,
            },
          });

        if (childCount > 0) {
          throw new ConflictException(
            `Cannot delete company with ${childCount} child companies.`,
          );
        }

        // 3. Delete company
        await tx.company.delete({
          where: { companyCode },
        });

        // 4. Write audit log before transaction commits
        await this.auditLogsService.record(
          {
            category: 'BUSINESS_ACTIVITY',
            action: 'DELETE_COMPANY',
            result: 'SUCCESS',

            actorId: context.actorId,
            actorName: context.actorName,
            actorRole: context.actorRole,

            targetType: 'COMPANY',
            targetId: company.companyCode,
            targetName: company.companyName,

            metadata: {
              before: {
                companyCode: company.companyCode,
                companyName: company.companyName,
                level: company.level,
                parentCompanyCode:
                  company.ownRelationship?.parentCompanyCode ?? null,
                country: company.country,
                city: company.city,
                foundedYear: company.foundedYear,
                annualRevenue: company.annualRevenue,
                employees: company.employees,
              },
            },

            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
          },
          tx,
        );
        // Record company statistics after deletion
        await this.captureCompanySnapshot(tx);

        return {
          message: 'Company deleted successfully.',
          companyCode,
        };
      });
    } catch (error: unknown) {
      await this.recordFailure(
        'DELETE_COMPANY',
        context,
        companyCode,
        companyCode,
        error,
      );

      if (
        error instanceof Prisma.PrismaClientKnownRequestError
      ) {
        if (error.code === 'P2003') {
          throw new ConflictException(
            'Company is referenced by other records and cannot be deleted.',
          );
        }

        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Company ${companyCode} not found.`,
          );
        }
      }

      throw error;
    }
  }

}
