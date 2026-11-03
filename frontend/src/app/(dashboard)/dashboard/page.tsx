'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { getCurrentUser, logout, type AuthUser } from '@/lib/api/auth';

import {ApiError} from '@/lib/api/client';

export default function DashboardPage() {
    const router = useRouter();
    
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0); 

    // Restore authentication state on page load
    useEffect(() => {
        let active = true; 

        async function loadCurrentUser() {
            setLoading(true);
            setError('');

            try{
                const result = await getCurrentUser();
                if (active) {
                    setUser(result.user);
                }
            } catch (err) {
                if(!active) return;
                setUser(null);
                if(err instanceof ApiError && err.status === 401){
                    setIsRedirecting(true);
                    router.replace('/login');
                    return;
                }
                setError(
                    err instanceof ApiError 
                    ? err.message 
                    : 'Unable to load your account information.'
                );
            }finally{
                if(active) setLoading(false);
            }
        }
        void loadCurrentUser();
        return () => {
            active = false;
        };
    }, [reloadKey, router]);


// Log out
const handleLogout = async () => {
    if(loggingOut) return;

    setLoggingOut(true);
    setError('');
    try {
        await logout();
        setIsRedirecting(true);
        setUser(null);
        
        router.replace('/login');
    } catch (error) {
        setError(
            error instanceof ApiError
                ? error.message
                : 'Logout failed. Please try again.'
        );
    } finally {
        setLoggingOut(false);
    }
    };

    if (loading || isRedirecting) {
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

    // Not authenticated or unable to load user
    if (!user) {
        return (
            <Container maxWidth="sm" sx={{ py: 8 }}>
                <Stack spacing={2}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <Button
                        variant = "outlined"
                        onClick={() => setReloadKey((prev)=>prev + 1)}
                    >
                        Retry
                    </Button>                
                </Stack>
            </Container>
        );
    }
    return (
        <Container maxWidth = "lg" sx={{py: 5}}>
            <Stack spacing = {4}>
                {/* Header */}
                <Stack
                    direction={{xs: 'column', sm: 'row'}}
                    spacing = {2}
                    sx ={{
                        justifyContent:"space-between",
                        alignItems: {
                            xs: 'flex-start', 
                            sm: 'center',
                        },
                    }}
                >
                    <Box>
                        <Typography
                            variant="h4" sx={{fontWeight:700}}>
                                Dashboard
                            </Typography>

                            <Typography color = "text.secondary" sx={{mt:1}}>
                                Welcome to Dashboard Project
                            </Typography>
                    </Box>

                    <Button
                        variant ="outlined"
                        color = "error"
                        onClick = {handleLogout}
                        disabled = {loggingOut}
                    >
                        {loggingOut ? 'Signing Out...':'Logout'}
                    </Button>
                </Stack>

                {/* API Error */}
                {error && <Alert severity="error">{error}</Alert>}

                {/* Current User */}
                <Paper variant = "outlined" sx={{p:3, borderRadius:3}}> 
                    <Stack spacing = {2}>
                        <Typography variant = "h6" sx={{fontWeight:600}}>
                            Current User
                        </Typography>
                        <Box>
                            <Typography variant = "body2" color = "text.secondary">
                                Email Address
                            </Typography>
                            <Typography sx = {{overflowWrap: 'anywhere'}}>
                                {user.email}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant = "body2" color = "text.secondary">
                                User ID
                            </Typography>
                            <Typography sx = {{overflowWrap: 'anywhere'}}>
                                {user.id}
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>
            </Stack>
        </Container>
    );
}

