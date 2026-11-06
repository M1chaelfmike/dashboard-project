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