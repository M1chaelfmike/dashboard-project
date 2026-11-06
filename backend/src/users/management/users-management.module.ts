
import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module.js';
import { AdminGuard } from '../../auth/guards/admin.guard.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuditLogsModule } from '../../audit-logs/audit-logs.module.js';

import { UsersManagementController } from './users-management.controller.js';
import { UsersManagementService } from './users-management.service.js';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    AuditLogsModule,
  ],
  controllers: [
    UsersManagementController,
  ],
  providers: [
    UsersManagementService,
    AdminGuard,
  ],
})
export class UsersManagementModule {}
