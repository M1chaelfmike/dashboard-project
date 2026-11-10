
'use client';

import {
  Box,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded';

import type { MetricTrend } from '@/lib/api/dashboard';

// ==================== Constants ====================

const TREND_COLORS = {
  up: '#22C55E',
  down: '#EF4444',
  neutral: '#94A3B8',
};

const numberFormatter = new Intl.NumberFormat('en-US');

// ==================== Helpers ====================

function formatDelta(value: number | null): string {
  if (value === null) return 'N/A';

  const prefix = value > 0 ? '+' : '';
  return `${prefix}${numberFormatter.format(value)}`;
}

function formatPercent(value: number | null): string {
  if (value === null) return 'N/A';

  if (value === 0) return '0.00%';

  const prefix = value > 0 ? '+' : '-';
  const absolute = Math.abs(value);

  if (absolute < 0.01) {
    return `${prefix}<0.01%`;
  }

  return `${prefix}${absolute.toFixed(2)}%`;
}

// ==================== Sparkline ====================

interface SparklineProps {
  points: number[];
  color: string;
}

function Sparkline({
  points,
  color,
}: SparklineProps) {
  if (points.length < 2) {
    return (
      <Box
        sx={{
          width: 105,
          height: 45,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          No history
        </Typography>
      </Box>
    );
  }

  const width = 105;
  const height = 45;
  const padding = 5;

  const min = Math.min(...points);
  const max = Math.max(...points);

  const range = max - min;
  const isFlat = range === 0;

  const coordinates = points.map((value, index) => {
    const x =
      padding +
      (index / (points.length - 1)) * (width - padding * 2);

    const y = isFlat
      ? height / 2
      : height -
        padding -
        ((value - min) / range) * (height - padding * 2);

    return { x, y };
  });

  const linePath = coordinates
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`,
    )
    .join(' ');

  const last = coordinates[coordinates.length - 1];

  return (
    <Box sx={{ width, height, flexShrink: 0 }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Historical KPI trend"
      >
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle
          cx={last.x}
          cy={last.y}
          r="3"
          fill={color}
        />
      </svg>
    </Box>
  );
}

// ==================== KPI Trend ====================

interface KpiTrendProps {
  trend: MetricTrend;
}

export default function KpiTrend({
  trend,
}: KpiTrendProps) {
  const hasHistory =
    trend.points.length >= 2 &&
    trend.deltaValue !== null;

  const direction = hasHistory
    ? trend.direction
    : 'neutral';

  const color = TREND_COLORS[direction];

  const TrendIcon =
    direction === 'up'
      ? TrendingUpRoundedIcon
      : direction === 'down'
        ? TrendingDownRoundedIcon
        : TrendingFlatRoundedIcon;

  const values = trend.points.map((point) => point.value);

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        minWidth: 0,
      }}
    >
      {/* Trend indicator */}
      <Stack sx={{ minWidth: 0 }}>
        <Tooltip
          arrow
          title={
            hasHistory
              ? `Change: ${formatDelta(trend.deltaValue)} since previous snapshot`
              : 'At least two snapshots are required.'
          }
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.4,
              width: 'fit-content',
              px: 1,
              py: 0.5,
              borderRadius: 2,
              bgcolor: alpha(color, 0.13),
              color,
            }}
          >
            <TrendIcon sx={{ fontSize: 17 }} />

            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {hasHistory
                ? formatPercent(trend.deltaPercent)
                : 'No trend'}
            </Typography>
          </Box>
        </Tooltip>


      </Stack>

      {/* Historical mini chart */}
      <Sparkline
        points={values}
        color={color}
      />
    </Stack>
  );
}
