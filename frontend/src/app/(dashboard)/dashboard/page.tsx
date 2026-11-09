'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';

import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';

import { useAuth } from '@/features/auth/use-auth';
import { ApiError } from '@/lib/api/client';

import {
  getDashboardOverview,
  type DashboardOverview,
} from '@/lib/api/dashboard';

import StatCard from '@/features/dashboard/components/stat-card';
import RecentActivities from '@/features/dashboard/components/recent-activities';

export default function DashboardPage() {
  const { isLoading: authLoading, refreshUser } = useAuth();
  const { user } = useAuth();

  const [overview, setOverview] =
    useState<DashboardOverview | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessError, setAccessError] = useState('');
  const [verifyingAccess, setVerifyingAccess] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const accessDenied = useRef(false);
  const identityCheckInFlight = useRef(false);
  const overviewRequestId = useRef(0);

  const verifyIdentity = useCallback(async (resume: boolean) => {
    if (identityCheckInFlight.current) return;

    identityCheckInFlight.current = true;
    setVerifyingAccess(true);

    try {
      const currentUser = await refreshUser();
      if (resume && currentUser?.status === 'ACTIVE') {
        accessDenied.current = false;
        setOverview(null);
        setError('');
        setLoading(true);
        setAccessError('');
        setReloadKey(previous => previous + 1);
      }
    } catch {
      // Authentication failures are rendered by the shared dashboard layout.
    } finally {
      identityCheckInFlight.current = false;
      setVerifyingAccess(false);
    }
  }, [refreshUser]);

  const handleAccessDenied = useCallback((failure: ApiError) => {
    if (accessDenied.current) return;

    accessDenied.current = true;
    overviewRequestId.current += 1;
    setOverview(null);
    setError('');
    setLoading(false);
    setAccessError(failure.message || 'Unable to verify Dashboard access.');
    void verifyIdentity(false);
  }, [verifyIdentity]);

  // Fetch dashboard statistics
  useEffect(() => {
    if (authLoading || accessDenied.current) return;

    let cancelled = false;
    const requestId = ++overviewRequestId.current;

    const fetchOverview = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getDashboardOverview();

        if (!cancelled && requestId === overviewRequestId.current) {
          setOverview(data);
        }
      } catch (err: unknown) {
        if (!cancelled && requestId === overviewRequestId.current) {
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            handleAccessDenied(err);
            return;
          }
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load dashboard data.',
          );
        }
      } finally {
        if (!cancelled && requestId === overviewRequestId.current) {
          setLoading(false);
        }
      }
    };

    fetchOverview();

    return () => {
      cancelled = true;
    };
  }, [authLoading, handleAccessDenied, reloadKey]);

  if (accessError) {
    return (
      <Stack spacing={3}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Alert severity="error">{accessError}</Alert>
        <Box>
          <Button
            variant="contained"
            disabled={verifyingAccess}
            onClick={() => void verifyIdentity(true)}
          >
            Retry
          </Button>
        </Box>
      </Stack>
    );
  }

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
        {user?.role === 'ADMIN' && (
          <RecentActivities onAccessDenied={handleAccessDenied} />
        )}
      </Stack>
    </Box>
  );
}
