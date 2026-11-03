'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    
    typography: {
      fontFamily: 'var(--font-geist-sans), Arial, sans-serif',
    },

  palette: {
    mode: 'light',

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
          borderRadius: 8,
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
