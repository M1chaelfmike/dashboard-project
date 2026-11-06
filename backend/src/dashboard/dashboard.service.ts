import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getOverview() {
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      totalCompanies,
    ] = await this.prisma.$transaction([
      // Total users
      this.prisma.user.count(),

      // Active users
      this.prisma.user.count({
        where: {
          status: 'ACTIVE',
        },
      }),

      // Pending approval users
      this.prisma.user.count({
        where: {
          status: 'PENDING_APPROVAL',
        },
      }),

      // Total companies
      this.prisma.company.count(),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        pending: pendingUsers,
      },
      companies: {
        total: totalCompanies,
      },
    };
  }

   /**
    * Get the latest 5 business activities.
    * Include both successful and failed operations.
    */
   async getRecentActivities() {
     return this.prisma.auditLog.findMany({
       where: {
         category: 'BUSINESS_ACTIVITY',
       },
       select: {
         id: true,
         action: true,
         result: true,

         actorName: true,
         actorRole: true,

         targetType: true,
         targetId: true,
         targetName: true,

         createdAt: true,
       },
       orderBy: {
         createdAt: 'desc',
       },
       take: 5,
     });
   }
}