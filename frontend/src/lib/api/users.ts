
import { apiRequest } from './client';

import type {
  AuthUser,
  UserRole,
  UserStatus,
} from './auth';

// ================================
// User List
// ================================

export interface ListUsersParams {
  search?: string;
  roles?: UserRole[];
  statuses?: UserStatus[];
  page?: number;
  pageSize?: number;
}

export interface UsersListResponse {
  items: AuthUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ================================
// Create User
// ================================

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

// ================================
// Update User
// ================================

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
}

// ================================
// API Responses
// ================================

export interface UserMutationResponse {
  message: string;
  user: AuthUser;
}

export type UserStatusAction = 'approve' | 'reject' | 'suspend' | 'reactivate';

export async function changeUserStatus(
  id: string,
  action: UserStatusAction,
): Promise<UserMutationResponse> {
  return apiRequest<UserMutationResponse>(
    `/users/${encodeURIComponent(id)}/${action}`,
    { method: 'PATCH' },
  );
}

export interface DeleteUserResponse {
  message: string;
  userId: string;
}

export interface DeleteUsersResponse {
  message: string;
  deletedCount: number;
  deletedIds: string[];
}

// ================================
// Get Users
// ================================

export async function getUsers(
  params: ListUsersParams = {},
): Promise<UsersListResponse> {

  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }

  if (params.roles?.length) {
    query.set('roles', params.roles.join(','));
  }

  if (params.statuses?.length) {
    query.set('statuses', params.statuses.join(','));
  }

  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }

  if (params.pageSize !== undefined) {
    query.set('pageSize', String(params.pageSize));
  }

  const queryString = query.toString();

  return apiRequest<UsersListResponse>(
    `/users${queryString ? `?${queryString}` : ''}`,
    {
      method: 'GET',
    },
  );
}

// ================================
// Get User By ID
// ================================

export async function getUserById(
  id: string,
): Promise<AuthUser> {
  return apiRequest<AuthUser>(
    `/users/${encodeURIComponent(id)}`,
    {
      method: 'GET',
    },
  );
}

// ================================
// Create User
// ================================

export async function createUser(
  data: CreateUserRequest,
): Promise<UserMutationResponse> {
  return apiRequest<UserMutationResponse>(
    '/users',
    {
      method: 'POST',
      body: data,
    },
  );
}

// ================================
// Update User
// ================================

export async function updateUser(
  id: string,
  data: UpdateUserRequest,
): Promise<UserMutationResponse> {
  return apiRequest<UserMutationResponse>(
    `/users/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: data,
    },
  );
}

// ================================
// Delete User
// ================================

export async function deleteUser(
  id: string,
): Promise<DeleteUserResponse> {
  return apiRequest<DeleteUserResponse>(
    `/users/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  );
}

// ================================
// Bulk Delete Users
// ================================

export async function deleteUsers(
  ids: string[],
): Promise<DeleteUsersResponse> {
  return apiRequest<DeleteUsersResponse>(
    '/users/bulk',
    {
      method: 'DELETE',
      body: { ids },
    },
  );
}
