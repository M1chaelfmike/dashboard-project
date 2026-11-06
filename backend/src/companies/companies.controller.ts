
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
} from '@nestjs/common';

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

    @Get()
    findAll(
        @Query(new ValidationPipe({
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
    findOne(@Param('code') companyCode: string) {
        return this.companiesService.findOne(companyCode);
    }

    @Post()
    @UseGuards(AdminGuard)
    create(@Body(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    })) dto: CreateCompanyDto) {
        return this.companiesService.create(dto);
    }

    @Patch(':code')
    @UseGuards(AdminGuard)
    update(
        @Param('code') companyCode: string,
        @Body(new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        })) dto: UpdateCompanyDto
    ) {
        return this.companiesService.update(companyCode, dto);
    }

    @Delete(':code')
    @UseGuards(AdminGuard)
    remove(@Param('code') code: string) {
        return this.companiesService.remove(code);
    }

}
