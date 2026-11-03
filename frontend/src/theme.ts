
'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    // Enable CSS variables for color schemes
    cssVariables: {
      colorSchemeSelector: 'class',
    },

    // Light and Dark color schemes
    colorSchemes: {
        light: {
            palette: {
                primary: {
                    main: '#2563EB',
                    dark: '#1D4ED8',
                    light: '#DBEAFE',
                },
                secondary: {
                    main: '#64748B',
                },
                background: {
                    default: '#F8FAFC',
                    paper: '#FFFFFF',
                },
                text: {
                    primary: '#0F172A',
                    secondary: '#64748B',
                },
                divider: '#E2E8F0',
            },
        },

        dark: {
            palette: {
                primary: {
                    main: '#60A5FA',
                    dark: '#3B82F6',
                    light: '#BFDBFE',
                },
                secondary: {
                    main: '#94A3B8',
                },
                background: {
                    default: '#0F172A',
                    paper: '#1E293B',
                },
                text: {
                    primary: '#F1F5F9',
                    secondary: '#94A3B8',
                },
                divider: '#334155',
            },
        },
    },

    typography: {
        fontFamily: 'var(--font-geist-sans), Arial, sans-serif',
    },

    shape: {
        borderRadius: 10,
    },

    components: {
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                },
            },
        },

        MuiTextField: {
            defaultProps: {
                fullWidth: true,
                size: 'medium',
            },
        },
    },
});

export default theme;
