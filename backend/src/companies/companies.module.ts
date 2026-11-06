import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';

import { CompaniesController } from './companies.controller.js';
import { CompaniesService } from './companies.service.js';

import { AdminGuard } from '../auth/guards/admin.guard.js';
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, AdminGuard],
})
export class CompaniesModule {}