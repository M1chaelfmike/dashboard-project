'use client';

import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';

import {
    getCurrentUser,
    loginByEmail,
    logout as logoutRequest,
    type AuthUser,
    type LoginByEmailRequest,
    type AuthResponse,
} from '@/lib/api/auth';

import { ApiError } from '@/lib/api/client';

export type AuthStatus = 
| 'loading' 
| 'authenticated' 
| 'unauthenticated'
| 'error';

// Context data and methods
export interface AuthContextValue {
    user: AuthUser | null;
    status: AuthStatus;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;

    login: (data: LoginByEmailRequest) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<AuthUser | null>;
}

// Create Context
export const AuthContext = createContext<
AuthContextValue | undefined
>(undefined);

// Provider Props
interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ 
    children, 
}: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [status, setStatus] = useState<AuthStatus>('loading');
    const [error, setError] = useState<string | null>(null);

    //Present stale authentication requests from overwriting newer state
    const requestIdRef = useRef(0);

    //get ccurrent authenticated user
    const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
        const requestId = ++requestIdRef.current;

        setStatus('loading');
        setError(null);

        try{
            const result = await getCurrentUser();

            if(requestId !== requestIdRef.current) 
                return null;
            
            setUser(result.user);
            setStatus('authenticated');
            return result.user;
        }catch(err){
            if(requestId !== requestIdRef.current) 
                return null;
            setUser(null);
            
            // 401
            if(err instanceof ApiError && err.status === 401){
                setStatus('unauthenticated');
                setError(null);

                return null;
            }

            const message = 
            err instanceof ApiError
            ? err.message
            : 'Unable to connect to the server.';

            setStatus('error');
            setError(message);
            throw err;
        }
    }, []);

    // Login
    const login = useCallback(async (
        data: LoginByEmailRequest
    ): Promise<AuthResponse> => {
        const result = await loginByEmail(data);

        requestIdRef.current += 1;

        setUser(result.user);
        setStatus('authenticated');
        setError(null);

        return result;
    }, []);

    // Logout
    const logout = useCallback(async (): Promise<void> => {
        await logoutRequest();

        //Invalidate any older /me requests
        requestIdRef.current += 1;

        setUser(null);
        setStatus('unauthenticated');
        setError(null);
    }, []);

    // Restore authentication state on application startup
    useEffect(() => {
        void refreshUser().catch(() => {
            // Error state is already set in refreshUser
        });
    }, [refreshUser]);

    // Context value
    const value = useMemo<AuthContextValue>(() => ({
        user,
        status,
        isLoading: status === 'loading',
        isAuthenticated: 
        status === 'authenticated' && user !== null,
        error,
        login,
        logout,
        refreshUser,
    }), [user, status, error, login, logout, refreshUser]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}