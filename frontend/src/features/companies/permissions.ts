
import type { AuthUser } from '@/lib/api/auth';

export interface CompanyPermissions {
  canView: boolean;
  canManage: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function getCompanyPermissions(
  operator: AuthUser | null | undefined,
): CompanyPermissions {
  const canView = operator?.status === 'ACTIVE';

  const canManage =
    canView && operator?.role === 'ADMIN';

  return {
    canView,
    canManage,
    canCreate: canManage,
    canUpdate: canManage,
    canDelete: canManage,
  };
}
