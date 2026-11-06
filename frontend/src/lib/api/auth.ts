
import { apiRequest } from './client';

export type UserRole = 'ADMIN' | 'MEMBER';

export type UserStatus =
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REJECTED';

// User information returned by backend
export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

// Signup request
export interface SignupByEmailRequest {
  name: string;
  email: string;
  password: string;
}

// Login request
export interface LoginByEmailRequest {
  email: string;
  password: string;
}

// Signup / Login response
export interface AuthResponse {
  message: string;
  user: AuthUser;
}

// Current user response
export interface CurrentUserResponse {
  user: AuthUser;
}


// Update current profile request
export interface UpdateMyProfileRequest {
  name: string;
  email: string;
}

// Update current profile response
export interface UpdateMyProfileResponse {
  message: string;
  user: AuthUser;
}

// Logout response
export interface LogoutResponse {
  message: string;
}

// Register by email
export async function signupByEmail(
  data: SignupByEmailRequest,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: data,
  });
}

// Login by email
export async function loginByEmail(
  data: LoginByEmailRequest,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: data,
  });
}

// Get current authenticated user
export async function getCurrentUser(): Promise<CurrentUserResponse> {
  return apiRequest<CurrentUserResponse>('/auth/me', {
    method: 'GET',
  });
}

// Update current authenticated user's profile
export async function updateMyProfile(
  data: UpdateMyProfileRequest,
): Promise<UpdateMyProfileResponse> {
  return apiRequest<UpdateMyProfileResponse>('/auth/me', {
    method: 'PATCH',
    body: data,
  });
}

// Logout
export async function logout(): Promise<LogoutResponse> {
  return apiRequest<LogoutResponse>('/auth/logout', {
    method: 'POST',
  });
}
