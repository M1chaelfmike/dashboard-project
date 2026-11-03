import {apiRequest} from './client';

// User information returned by the backend
export interface AuthUser {
    id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
}

// Signup request
export interface SignupByEmailRequest {
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
    user:AuthUser;
}

// Logout response
export interface LogoutResponse {
    message: string;
}

// Regiseter by email
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

// Logout
export async function logout(): Promise<LogoutResponse> {
    return apiRequest<LogoutResponse>('/auth/logout', {
        method: 'POST',
    });
}
