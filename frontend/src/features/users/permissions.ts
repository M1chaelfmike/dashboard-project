import type { AuthUser, UserRole, UserStatus } from '@/lib/api/auth';
import type { UserStatusAction } from '@/lib/api/users';

export type { UserStatusAction } from '@/lib/api/users';

export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: 'Manage users and company data.',
  MEMBER: 'View company data and edit own profile.',
};

export const USER_STATUS_ACCESS: Record<UserStatus, string> = {
  PENDING_APPROVAL: 'Cannot sign in until approved.',
  ACTIVE: 'Access follows the assigned role.',
  SUSPENDED: 'Sign-in and existing sessions are blocked.',
  REJECTED: 'Registration rejected. Cannot sign in.',
};

export const USER_STATUS_ACTION_LABELS: Record<UserStatusAction, string> = {
  approve: 'Approve',
  reject: 'Reject',
  suspend: 'Suspend',
  reactivate: 'Reactivate',
};

const transitionFrom: Record<UserStatusAction, UserStatus> = {
  approve: 'PENDING_APPROVAL',
  reject: 'PENDING_APPROVAL',
  suspend: 'ACTIVE',
  reactivate: 'SUSPENDED',
};

export function canManageUsers(
  operator: AuthUser | null | undefined,
): boolean {
  return operator?.role === 'ADMIN' &&
    operator.status === 'ACTIVE';
}

export function isCurrentUser(operator: AuthUser | null | undefined, target: AuthUser): boolean {
  return operator?.id.toLowerCase() === target.id.toLowerCase();
}

export function canChangeUserRole(operator: AuthUser | null | undefined, target: AuthUser): boolean {
  return canManageUsers(operator) && !isCurrentUser(operator, target);
}

export function getDeleteDisabledReason(operator: AuthUser | null | undefined, target: AuthUser): string | null {
  if (!canManageUsers(operator)) return 'Active administrator access is required.';
  if (isCurrentUser(operator, target)) return 'You cannot delete your own account.';
  return null;
}

export function getStatusActionDisabledReason(
  operator: AuthUser | null | undefined,
  target: AuthUser,
  action: UserStatusAction,
): string | null {
  if (!canManageUsers(operator)) return 'Active administrator access is required.';
  if (action === 'suspend' && isCurrentUser(operator, target)) return 'You cannot suspend your own account.';
  if (target.status !== transitionFrom[action]) return 'This action is unavailable for the current account status.';
  return null;
}

export function getAvailableStatusActions(
  operator: AuthUser | null | undefined,
  target: AuthUser,
): UserStatusAction[] {
  return (Object.keys(transitionFrom) as UserStatusAction[])
    .filter(action => getStatusActionDisabledReason(operator, target, action) === null);
}
