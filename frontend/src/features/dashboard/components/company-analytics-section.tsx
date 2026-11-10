
'use client';

import { useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import {
  getCompanyAnalytics,
  type CompanyAnalytics,
} from '@/lib/api/dashboard';

import CompanyLevelChart from './company-level-chart';
import CompanyGrowthChart from './company-growth-chart';
import KpiTrend from './kpi-trend';

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

const exactFormatter = new Intl.NumberFormat('en-US');

export default function CompanyAnalyticsSection() {
  const [data, setData] = useState<CompanyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getCompanyAnalytics();

        if (!cancelled) {
          setData(result);
          setError('');
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load company analytics.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);


    // Automatically refresh analytics when the tab regains focus
    // or every 60 seconds while the page is visible.
    useEffect(() => {
      const triggerRefresh = () => {
        setReloadKey((previous) => previous + 1);
      };

      // Refresh when returning to this browser tab.
      window.addEventListener('focus', triggerRefresh);

      // Periodically refresh while the page is visible.
      const intervalId = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          triggerRefresh();
        }
      }, 60_000);

      return () => {
        window.removeEventListener('focus', triggerRefresh);
        window.clearInterval(intervalId);
      };
    }, []);


  function refresh() {
    if (loading) return;

    setLoading(true);
    setError('');
    setReloadKey((previous) => previous + 1);
  }

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Alert
        severity="error"
        action={
          <Button onClick={refresh} color="inherit">
            Retry
          </Button>
        }
      >
        {error || 'No company analytics available.'}
      </Alert>
    );
  }



  const cards = [
    {
      title: 'Companies',
      value: data.summary.totalCompanies,
      icon: <BusinessOutlinedIcon />,
      color: '#5B9CF6',
      trend: data.trends.companies,
    },
    {
      title: 'Total Revenue',
      value: data.summary.totalRevenue,
      icon: <AccountBalanceWalletOutlinedIcon />,
      color: '#A78BFA',
      trend: data.trends.revenue,
    },
    {
      title: 'Countries',
      value: data.summary.totalCountries,
      icon: <PublicOutlinedIcon />,
      color: '#2DD4BF',
      trend: data.trends.countries,
    },
    {
      title: 'Employees',
      value: data.summary.totalEmployees,
      icon: <GroupsOutlinedIcon />,
      color: '#F5B84B',
      trend: data.trends.employees,
    },
  ];


  return (
    <Stack spacing={2.5}>
      {/* Section header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          alignItems: {
            xs: 'flex-start',
            sm: 'center',
          },
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontSize: { xs: '1.6rem', md: '2rem' },
              fontWeight: 800,
              letterSpacing: '-0.025em',
            }}
          >
            Dashboard
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshRoundedIcon />}
          disabled={loading}
          onClick={refresh}
          sx={{ borderRadius: 2 }}
        >
          {loading ? 'Refreshing' : 'Refresh'}
        </Button>
      </Stack>

      {error && (
        <Alert severity="warning">
          {error} Showing previously loaded data.
        </Alert>
      )}

      {/* KPI Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 2.5,
        }}
      >
        {cards.map((card) => (
          <Paper
            key={card.title}
            elevation={0}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              minWidth: 0,
              minHeight: 200,
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',

              transition:
                'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',

              '&:hover': {
                transform: 'translateY(-3px)',
                borderColor: card.color,
                boxShadow: `0 12px 30px ${alpha(card.color, 0.10)}`,
              },
            }}
          >
            {/* Subtle background accent */}
            <Box
              sx={{
                position: 'absolute',
                right: -45,
                bottom: -75,
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(
                  card.color,
                  0.16,
                )} 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />

            <Stack
              spacing={2}
              sx={{
                position: 'relative',
                height: '100%',
                justifyContent: 'space-between',
              }}
            >
              <Stack
                direction="row"
                sx={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                spacing={1}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {card.title}
                </Typography>

                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2.5,
                    bgcolor: alpha(card.color, 0.13),
                    color: card.color,
                  }}
                >
                  {card.icon}
                </Box>
              </Stack>

              <Box>
                <Tooltip
                  title={exactFormatter.format(card.value)}
                  arrow
                >
                  <Typography
                    sx={{
                      display: 'inline-block',
                      fontSize: {
                        xs: '1.9rem',
                        md: '2.1rem',
                      },
                      fontWeight: 800,
                      lineHeight: 1.15,
                      letterSpacing: '-0.04em',
                      fontVariantNumeric: 'tabular-nums',
                      cursor: 'help',
                    }}
                  >
                    {compactFormatter.format(card.value)}
                  </Typography>
                </Tooltip>


              </Box>
              {/* Historical KPI trend */}
              <KpiTrend trend={card.trend} />
            </Stack>
          </Paper>
        ))}
      </Box>

      {/* Analytics charts */}

      {/* Analytics Charts */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            xl: 'repeat(2, minmax(0, 1fr))',
          },
          gap: 2.5,
          alignItems: 'stretch',
          minWidth: 0,
        }}
      >
        {/* Left: Company Distribution */}
        <CompanyLevelChart
          distribution={data.levelDistribution}
          totalCompanies={data.summary.totalCompanies}
        />

        {/* Right: Cumulative Company Growth */}
        <CompanyGrowthChart
          growth={data.growth}
        />
      </Box>

    </Stack>
  );
}
