
import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard.js';

import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  // All authenticated active users can view dashboard overview
  @Get('overview')
  getOverview() {
    return this.dashboardService.getOverview();
  }

  // Only ADMIN can view global recent activities
  @Get('recent-activities')
  getRecentActivities(
    @Req() request: AuthenticatedRequest,
  ) {
    if (request.currentUser.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only administrators can view recent activities.',
      );
    }

    return this.dashboardService.getRecentActivities();
  }
}
