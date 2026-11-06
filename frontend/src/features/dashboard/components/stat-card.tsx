import type { ReactNode } from 'react';

import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
  iconColor?: 'primary' | 'success' | 'warning' | 'info';
}

export default function StatCard({
  title,
  value,
  description,
  icon,
  iconColor = 'primary',
}: StatCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 3,
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          '&:last-child': {
            pb: 2.5,
          },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {title}
            </Typography>

            <Typography
              variant="h4"
              component="div"
              sx={{
                mt: 1.5,
                fontWeight: 700,
              }}
            >
              {new Intl.NumberFormat('en-US').format(value)}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              {description}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 46,
              height: 46,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              bgcolor: 'action.hover',
              color: `${iconColor}.main`,
              '& svg': {
                fontSize: 25,
              },
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}