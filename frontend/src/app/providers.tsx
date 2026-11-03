'use client';

import type { ReactNode } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';

import theme from '../theme';

import { AuthProvider } from '@/features/auth/auth-provider';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ 
    children, 
}: ProvidersProps) {
        return(
            <ThemeProvider 
            theme={theme}
            defaultMode = 'system'
            disableTransitionOnChange
            >
                <CssBaseline />
                <AuthProvider>
                    {children}
                </AuthProvider>
                </ThemeProvider>
        );
    }