
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListCompaniesQueryDto } from './dto/list-companies-query.dto.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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

  async create(dto: CreateCompanyDto) {
    if (dto.companyCode === dto.parentCompanyCode) {
      throw new BadRequestException(
        'A company cannot be its own parent.',
      );
    }

    try {
      const company = await this.prisma.$transaction(
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


  async update(companyCode: string, dto: UpdateCompanyDto) {
    const hasAtLeastOneField = Object.values(dto).some(
      (value) => value !== undefined,
    );

    if(!hasAtLeastOneField){
        throw new BadRequestException(
             'At least one field must be provided.',
        );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Find the existing company and relationship
        const current = await tx.company.findUnique({
          where: { companyCode },
          select: {
            level: true,
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

        // 2. Protect the root company
        if (
          current.level === 1 &&
          (dto.level !== undefined ||
            dto.parentCompanyCode !== undefined)
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

        // 3. Prevent a company from parenting itself
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

        // 5. Validate the new or existing parent
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

        // 8. Return the updated company
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

  async remove(companyCode: string) {
    try{
      return await this.prisma.$transaction(async (tx) => {

        const company = await tx.company.findUnique({
          where: { companyCode },
          select: {
            level: true,
            companyCode: true,
          },
        });

        if(!company){
          throw new NotFoundException(
            `Company ${companyCode} not found.`,
          );
        }

        if(company.level === 1){
          throw new BadRequestException(
            'Root company cannot be deleted.',
          );
        }

        const childCount = await tx.companyRelationship.count({
          where: {
            parentCompanyCode: companyCode,
          },
        });

        if(childCount > 0){
          throw new ConflictException(
            `Cannot delete company with ${childCount} child companies.`,
          );
        }

        await tx.company.delete({
          where: { companyCode },
        });

        return {
          message: 'Company deleted successfully.',
          companyCode,
        };
      });
    }catch(error: unknown){

      if(error instanceof Prisma.PrismaClientKnownRequestError){
        if(error.code === 'P2003'){
          throw new ConflictException(
            'Company is referenced by other records and cannot be deleted.',
          );
        }

        if(error.code === 'P2025'){
          throw new NotFoundException(
            `Company ${companyCode} not found.`,
          );
        }
      }
      throw error;
    }
  }
}