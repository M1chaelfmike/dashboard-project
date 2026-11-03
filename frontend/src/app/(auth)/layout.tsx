
import type { ReactNode } from 'react';


import {
  Box,
  Container,
  Typography,
} from '@mui/material';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <Box component="header" sx={{ py: 3 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
            }}
          >
            Dashboard Project
          </Typography>
        </Container>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 5,
        }}
      >
        <Container maxWidth="sm">
          {children}
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Supply Chain Tracking Dashboard
        </Typography>
      </Box>
    </Box>
  );
}
