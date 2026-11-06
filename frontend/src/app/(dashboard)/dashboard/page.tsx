'use client';

import { useEffect, useState } from 'react';

import {
  Alert,
  Box,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';

import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';

import { useAuth } from '@/features/auth/use-auth';

import {
  getDashboardOverview,
  type DashboardOverview,
} from '@/lib/api/dashboard';

import StatCard from '@/features/dashboard/components/stat-card';
import RecentActivities from '@/features/dashboard/components/recent-activities';

export default function DashboardPage() {
  const { isLoading: authLoading } = useAuth();

  const [overview, setOverview] =
    useState<DashboardOverview | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch dashboard statistics
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    const fetchOverview = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getDashboardOverview();

        if (!cancelled) {
          setOverview(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load dashboard data.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchOverview();

    return () => {
      cancelled = true;
    };
  }, [authLoading]);

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={3}>

        {/* Page Header */}
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700 }}
          >
            Dashboard
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Overview of your system.
          </Typography>
        </Box>

        {/* Loading */}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              py: 6,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* Error */}
        {!loading && error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        {/* Statistics */}
        {!loading && overview && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            <StatCard
              title="Total Users"
              value={overview.users.total}
              description="All registered users"
              icon={<PeopleAltOutlinedIcon />}
              iconColor="primary"
            />

            <StatCard
              title="Active Users"
              value={overview.users.active}
              description="Currently active accounts"
              icon={<CheckCircleOutlineOutlinedIcon />}
              iconColor="success"
            />

            <StatCard
              title="Pending Users"
              value={overview.users.pending}
              description="Awaiting approval"
              icon={<HourglassEmptyOutlinedIcon />}
              iconColor="warning"
            />

            <StatCard
              title="Total Companies"
              value={overview.companies.total}
              description="All registered companies"
              icon={<BusinessOutlinedIcon />}
              iconColor="info"
            />
          </Box>
        )}

        {/* Recent Activities */}
        <RecentActivities />

      </Stack>
    </Box>
  );
}