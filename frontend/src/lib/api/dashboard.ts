import { apiRequest } from './client';

// ==================== Types ====================

export interface DashboardOverview {
  users: {
    total: number;
    active: number;
    pending: number;
  };

  companies: {
    total: number;
  };
}

export type AuditLogResult = 'SUCCESS' | 'FAILURE';

export type AuditActorRole = 'ADMIN' | 'MEMBER';

export interface RecentActivity {
  id: string;
  action: string;
  result: AuditLogResult;

  actorName: string | null;
  actorRole: AuditActorRole | null;

  targetType: string | null;
  targetId: string | null;
  targetName: string | null;

  createdAt: string;
}

export interface CompanyAnalyticsSummary {
  totalCompanies: number;
  totalRevenue: number;
  totalCountries: number;
  totalEmployees: number;
}

export interface CompanyLevelDistribution {
  level: number;
  count: number;
  percentage: number;
}

export interface CompanyGrowth {
  year: number;
  newCompanies: number;
  cumulativeCompanies: number;
}

export interface MetricTrendPoint {
  time: string;
  value: number;
}

export interface MetricTrend {
  direction: 'up' | 'down' | 'neutral';
  deltaValue: number | null;
  deltaPercent: number | null;
  points: MetricTrendPoint[];
}

export interface CompanyAnalyticsTrends {
  companies: MetricTrend;
  revenue: MetricTrend;
  countries: MetricTrend;
  employees: MetricTrend;
}


export interface CompanyAnalytics {
  summary: CompanyAnalyticsSummary;
  levelDistribution: CompanyLevelDistribution[];
  growth: CompanyGrowth[];

  // Historical KPI trends
  trends: CompanyAnalyticsTrends;
}

// ==================== API ====================

export async function getDashboardOverview(): Promise<DashboardOverview> {
  return apiRequest<DashboardOverview>(
    '/dashboard/overview',
  );
}

export async function getRecentActivities(): Promise<RecentActivity[]> {
  return apiRequest<RecentActivity[]>(
    '/dashboard/recent-activities',
  );
}

export async function getCompanyAnalytics(): Promise<CompanyAnalytics> {
  return apiRequest<CompanyAnalytics>(
    '/dashboard/company-analytics',
  );
}
