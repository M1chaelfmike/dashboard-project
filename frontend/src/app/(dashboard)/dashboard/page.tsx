
'use client';

import { useState } from 'react';

import {
    Alert,
    Box,
    Button,
    Container,
    Paper,
    Stack,
    Typography,
} from '@mui/material';

import { useAuth } from '@/features/auth/use-auth';

export default function DashboardPage() {

    const {
        user,
        logout,
    } = useAuth();

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState('');

    const handleLogout = async () => {

        if (isLoggingOut) return;

        setIsLoggingOut(true);
        setLogoutError('');

        try {
            await logout();

            // AuthProvider updates the global status.
            // DashboardLayout will redirect to /login.

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

    // DashboardLayout ensures authentication.
    if (!user) {
        return null;
    }

    return (
        <Container maxWidth="lg" sx={{ py: 5 }}>
            <Stack spacing={4}>

                {/* Header */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{
                        justifyContent: 'space-between',
                        alignItems: {
                            xs: 'flex-start',
                            sm: 'center',
                        },
                    }}
                >
                    <Box>
                        <Typography
                            variant="h4"
                            sx={{ fontWeight: 700 }}
                        >
                            Dashboard
                        </Typography>

                        <Typography
                            color="text.secondary"
                            sx={{ mt: 1 }}
                        >
                            Welcome to Dashboard Project
                        </Typography>
                    </Box>

                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut
                            ? 'Signing Out...'
                            : 'Logout'}
                    </Button>
                </Stack>

                {logoutError && (
                    <Alert severity="error">
                        {logoutError}
                    </Alert>
                )}

                {/* Current User */}
                <Paper
                    variant="outlined"
                    sx={{
                        p: 3,
                        borderRadius: 3,
                    }}
                >
                    <Stack spacing={2}>

                        <Typography
                            variant="h6"
                            sx={{ fontWeight: 600 }}
                        >
                            Current User
                        </Typography>

                        <Box>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Email Address
                            </Typography>

                            <Typography
                                sx={{ overflowWrap: 'anywhere' }}
                            >
                                {user.email}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                User ID
                            </Typography>

                            <Typography
                                sx={{ overflowWrap: 'anywhere' }}
                            >
                                {user.id}
                            </Typography>
                        </Box>

                    </Stack>
                </Paper>

            </Stack>
        </Container>
    );
}
