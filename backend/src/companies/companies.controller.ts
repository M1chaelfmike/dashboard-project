
import {
  Controller,
  Get,
  Query,
  UseGuards,
  ValidationPipe,
  Param,
  Body,
  Post,
  Patch,
  Delete,
  Req,
} from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard.js';
import type { AuditActorContext } from '../audit-logs/audit-logs.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';

import { CompaniesService } from './companies.service.js';
import { ListCompaniesQueryDto } from './dto/list-companies-query.dto.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
  ) {}

  /**
   * Build audit context from the authenticated HTTP request.
   */
  private getAuditContext(
    request: AuthenticatedRequest,
  ): AuditActorContext {
    return {
      actorId: request.currentUser.id,
      actorName: request.currentUser.name ?? null,
      actorRole: request.currentUser.role,
      ipAddress: request.ip ?? null,
      userAgent: request.get('user-agent') ?? null,
    };
  }

  // Ordinary queries are not audited.
  @Get()
  findAll(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: ListCompaniesQueryDto,
  ) {
    return this.companiesService.findAll(query);
  }

  @Get(':code')
  findOne(
    @Param('code') companyCode: string,
  ) {
    return this.companiesService.findOne(companyCode);
  }

  // CREATE_COMPANY
  @Post()
  @UseGuards(AdminGuard)
  create(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    dto: CreateCompanyDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.companiesService.create(
      dto,
      this.getAuditContext(request),
    );
  }

  // UPDATE_COMPANY
  @Patch(':code')
  @UseGuards(AdminGuard)
  update(
    @Param('code') companyCode: string,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    dto: UpdateCompanyDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.companiesService.update(
      companyCode,
      dto,
      this.getAuditContext(request),
    );
  }

  // DELETE_COMPANY
  @Delete(':code')
  @UseGuards(AdminGuard)
  remove(
    @Param('code') companyCode: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.companiesService.remove(
      companyCode,
      this.getAuditContext(request),
    );
  }
}
