
'use client';

import { useState, type ReactNode } from 'react';

import {
    Alert,
    Box,
} from '@mui/material';

import { useAuth } from '@/features/auth/use-auth';

import Header from './header';
import Sidebar, { DRAWER_WIDTH } from './sidebar';

interface DashboardShellProps {
    children: ReactNode;
}

export default function DashboardShell({
    children,
}: DashboardShellProps) {

    const {
        user,
        logout,
    } = useAuth();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState('');

    const handleLogout = async () => {

        if (isLoggingOut) return;

        setIsLoggingOut(true);
        setLogoutError('');

        try {
            // AuthProvider clears the global user state.
            // DashboardLayout will redirect to /login.
            await logout();

        } catch (error) {

            setLogoutError(
                error instanceof Error
                    ? error.message
                    : 'Logout failed. Please try again.',
            );

        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh' }}>

            <Header
                user={user}
                onMenuClick={() => setMobileOpen(true)}
                onLogout={handleLogout}
                isLoggingOut={isLoggingOut}
            />

            <Sidebar
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
            />

            <Box
                component="main"
                sx={{
                    ml: {
                        md: `${DRAWER_WIDTH}px`,
                    },
                    pt: {
                        xs: '56px',
                        sm: '64px',
                    },
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                }}
            >
                <Box
                    sx={{
                        p: {
                            xs: 2,
                            sm: 3,
                            md: 4,
                        },
                    }}
                >
                    {logoutError && (
                        <Alert
                            severity="error"
                            sx={{ mb: 3 }}
                        >
                            {logoutError}
                        </Alert>
                    )}

                    {children}
                </Box>
            </Box>

        </Box>
    );
}
