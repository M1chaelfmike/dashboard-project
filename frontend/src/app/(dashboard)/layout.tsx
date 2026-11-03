'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Stack,
    Typography,
} from '@mui/material';

import { useAuth } from '@/features/auth/use-auth';

import DashboardShell from '@/components/dashboard/dashboard-shell';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ 
    children 
}: DashboardLayoutProps) {

    const router = useRouter();

    const {
        status,
        error,
        refreshUser,
    }= useAuth();

    // Redirect unauthenticated users
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/login');
        }
    }, [status, router]);

    // Retry authentication request
    const handleRetry = async () => {
        void refreshUser().catch(() => {
            // Error state is handled by AuthProvider
        });
    };

    // Loading or redirecting 
    if (status === 'loading' || status === 'unauthenticated') {
        return (
            <Box
                sx={{
                    minHeight: '70vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    // Backend or network error
    if (status === 'error') {
        return (
            <Container maxWidth="sm" sx={{ py: 8}}>
                <Stack spacing={2}>
                    <Alert severity="error">
                        {error || 'Unable to verify your identity.'}
                    </Alert>

                    <Button
                        variant="contained"
                        onClick={handleRetry}
                    >
                        Retry
                    </Button>
                </Stack>
            </Container>
        );
    }

    // Only authenticated users can access dashboard routes
    if(status !== 'authenticated') {
        return null;
    }

    return ( <DashboardShell>
        {children}
        </DashboardShell>);
}
                
