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


     /**
      * Company analytics for the Dashboard.
      *
      * - Summary KPI cards
      * - Company distribution by level
      * - Cumulative growth by founded year
      *
      * All statistics are calculated from the companies table.
      */
     async getCompanyAnalytics() {
       // 1. Aggregate data within a consistent database snapshot
       const { totals, levelGroups, yearGroups, countryGroups, snapshotRows } =
         await this.prisma.$transaction(
           async (tx) => {
             const [totals, levelGroups, yearGroups, countryGroups] = await Promise.all([
             // Summary: total count, revenue, employees
             tx.company.aggregate({
               _count: {
                 _all: true,
               },
               _sum: {
                 annualRevenue: true,
                 employees: true,
               },
             }),

             // Count companies by level
             tx.company.groupBy({
               by: ['level'],
               _count: {
                 _all: true,
               },
               orderBy: {
                 level: 'asc',
               },
             }),

             // Count companies by founded year
             tx.company.groupBy({
               by: ['foundedYear'],
               _count: {
                 _all: true,
               },
               orderBy: {
                 foundedYear: 'asc',
               },
             }),

             // Get distinct country groups
             tx.company.groupBy({
               by: ['country'],
               _count: {
                 _all: true,
               },
             }),
             ]);

             // History must use the same RepeatableRead snapshot as the totals.
             const snapshotRows = await tx.dashboardCompanySnapshot.findMany({
               orderBy: [{ capturedAt: 'desc' }, { id: 'desc' }],
               take: 12,
               select: {
                 capturedAt: true,
                 totalCompanies: true,
                 totalRevenue: true,
                 totalCountries: true,
                 totalEmployees: true,
               },
             });

             return { totals, levelGroups, yearGroups, countryGroups, snapshotRows };
           },
           {
             isolationLevel: 'RepeatableRead',
           },
         );

       // 2. Build summary cards
       const totalCompanies = totals._count._all;
       const totalRevenue = totals._sum.annualRevenue ?? 0;
       const totalEmployees = totals._sum.employees ?? 0;

       // Normalize country names before counting unique values.
       const normalizedCountries = new Set(
         countryGroups
           .map((item) => item.country.trim().toLowerCase())
           .filter((country) => country.length > 0),
       );

       const totalCountries = normalizedCountries.size;

       const summary = {
         totalCompanies,
         totalRevenue,
         totalCountries,
         totalEmployees,
       };

       // 3. Calculate level distribution
       const levelDistribution = levelGroups.map((item) => {
         const count = item._count._all;

         const percentage =
           totalCompanies > 0
             ? Number(
                 ((count / totalCompanies) * 100).toFixed(2),
               )
             : 0;

         return {
           level: item.level,
           count,
           percentage,
         };
       });

       // 4. Prepare counts by founded year
       const countsByYear = new Map<number, number>(
         yearGroups.map((item) => [
           item.foundedYear,
           item._count._all,
         ]),
       );

       // 5. Calculate cumulative company growth
       const growth: Array<{
         year: number;
         newCompanies: number;
         cumulativeCompanies: number;
       }> = [];

       let cumulativeCompanies = 0;

       if (yearGroups.length > 0) {
         const firstYear = yearGroups[0].foundedYear;

         const lastYear =
           yearGroups[yearGroups.length - 1].foundedYear;

         // Include years with zero new companies.
         for (let year = firstYear; year <= lastYear; year++) {
           const newCompanies = countsByYear.get(year) ?? 0;

           cumulativeCompanies += newCompanies;

           growth.push({
             year,
             newCompanies,
             cumulativeCompanies,
           });
         }
       }


           // Convert to chronological order.
           // BigInt must be converted before JSON serialization.
           const snapshots = snapshotRows.reverse().map((row) => {
             const totalRevenue = Number(row.totalRevenue);
             const totalEmployees = Number(row.totalEmployees);

             if (
               !Number.isSafeInteger(totalRevenue) ||
               !Number.isSafeInteger(totalEmployees)
             ) {
               throw new Error(
                 'Dashboard snapshot exceeds JavaScript safe integer range.',
               );
             }

             return {
               capturedAt: row.capturedAt.toISOString(),
               totalCompanies: row.totalCompanies,
               totalRevenue,
               totalCountries: row.totalCountries,
               totalEmployees,
             };
           });

           type MetricKey = keyof typeof summary;

           const buildTrend = (metric: MetricKey) => {
             const points = snapshots.map((snapshot) => ({
               time: snapshot.capturedAt,
               value: snapshot[metric],
             }));

             // At least two snapshots are needed for comparison.
             if (points.length < 2) {
               return {
                 direction: 'neutral' as const,
                 deltaValue: null,
                 deltaPercent: null,
                 points,
               };
             }

             const current = points[points.length - 1].value;
             const previous = points[points.length - 2].value;

             const deltaValue = current - previous;

             const deltaPercent =
               previous === 0
                 ? deltaValue === 0 ? 0 : null
                 : (deltaValue / previous) * 100;

             return {
               direction:
                 deltaValue > 0
                   ? ('up' as const)
                   : deltaValue < 0
                     ? ('down' as const)
                     : ('neutral' as const),
               deltaValue,
               deltaPercent,
               points,
             };
           };

           const trends = {
             companies: buildTrend('totalCompanies'),
             revenue: buildTrend('totalRevenue'),
             countries: buildTrend('totalCountries'),
             employees: buildTrend('totalEmployees'),
           };


       // 6. Return data for all dashboard components
       return {
         summary,
         levelDistribution,
         growth,
         trends,
       };
     }

}
