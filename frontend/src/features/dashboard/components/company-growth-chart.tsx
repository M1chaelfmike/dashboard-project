
'use client';

import { useState } from 'react';

import {
  Box,
  Paper,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  type ChartOptions,
  type Plugin,
} from 'chart.js';

import { Line } from 'react-chartjs-2';

import type { CompanyGrowth } from '@/lib/api/dashboard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip,
);

const LINE_COLOR = '#5B9CF6';
const numberFormatter = new Intl.NumberFormat('en-US');

type GrowthRange = 'all' | '30y' | '10y';

interface Props {
  growth: CompanyGrowth[];
}

export default function CompanyGrowthChart({ growth }: Props) {
  const theme = useTheme();

  // ============================
  // Year Range Selection
  // ============================

  const [range, setRange] = useState<GrowthRange>('30y');

  // Filter invalid founded years and ensure ascending order.
  const validGrowth = growth
    .filter(
      (item) =>
        Number.isInteger(item.year) &&
        item.year >= 1 &&
        item.year <= 9999,
    )
    .sort((a, b) => a.year - b.year);

  // The latest year is determined by company data.
  const lastPoint = validGrowth[validGrowth.length - 1];
  const latestYear = lastPoint?.year;

  // The range includes the latest year itself.
  // Example: 2023 - 29 = 1994.
  const startYear =
    latestYear === undefined || range === 'all'
      ? null
      : range === '30y'
        ? Math.max(1, latestYear - 29)
        : Math.max(1, latestYear - 9);

  // Only filter the visible points.
  // Do not recalculate cumulativeCompanies.
  const visibleGrowth =
    startYear === null
      ? validGrowth
      : validGrowth.filter((item) => item.year >= startYear);

  const firstVisibleYear = visibleGrowth[0]?.year;


    // Select evenly distributed X-axis labels.
    // Keep both the first and last year visible.
    const xTickCount = Math.min(
      range === '10y' ? 5 : 6,
      visibleGrowth.length,
    );

    const xTickIndices = new Set(
      Array.from({ length: xTickCount }, (_, i) =>
        xTickCount === 1
          ? 0
          : Math.round(
              (i * (visibleGrowth.length - 1)) /
                (xTickCount - 1),
            ),
      ),
    );


  // ============================
  // Chart Data
  // ============================

  const chartData = {
    labels: visibleGrowth.map((item) => String(item.year)),
    datasets: [
      {
        label: 'Cumulative Companies',
        data: visibleGrowth.map(
          (item) => item.cumulativeCompanies,
        ),

        borderColor: LINE_COLOR,
        backgroundColor: alpha(LINE_COLOR, 0.12),
        borderWidth: 2.5,

        fill: true,
        tension: 0,

        pointRadius: 0,
        pointHitRadius: 12,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: LINE_COLOR,
        pointHoverBorderColor: theme.palette.background.paper,
        pointHoverBorderWidth: 2,
      },
    ],
  };


    const hoverGuidePlugin: Plugin<'line'> = {
      id: 'hoverGuidePlugin',

      // Draw horizontal dashed grid lines at Y-axis ticks.
      beforeDatasetsDraw(chart) {
        const { ctx, chartArea } = chart;
        const yScale = chart.scales.y;

        if (!yScale) return;

        ctx.save();

        // Keep the lines inside the plotting area.
        ctx.beginPath();
        ctx.rect(
          chartArea.left,
          chartArea.top,
          chartArea.right - chartArea.left,
          chartArea.bottom - chartArea.top,
        );
        ctx.clip();

        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;

        ctx.strokeStyle =
          theme.palette.mode === 'dark'
            ? 'rgba(148, 163, 184, 0.58)'
            : 'rgba(100, 116, 139, 0.36)';

        yScale.ticks.forEach((_, index) => {
          const y = yScale.getPixelForTick(index);

          if (
            typeof y !== 'number' ||
            !Number.isFinite(y)
          ) {
            return;
          }

          ctx.moveTo(chartArea.left, y);
          ctx.lineTo(chartArea.right, y);
        });

        ctx.stroke();
        ctx.restore();
      },

      // Draw the vertical guide at the hovered data point.
      afterDatasetsDraw(chart) {
        const { ctx, tooltip, chartArea } = chart;
        const activeElements =
          tooltip?.getActiveElements() ?? [];

        if (activeElements.length === 0) return;

        const x = activeElements[0].element.x;

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([4, 4]);

        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);

        ctx.lineWidth = 1.5;

        ctx.strokeStyle =
          theme.palette.mode === 'dark'
            ? 'rgba(191, 219, 254, 0.85)'
            : 'rgba(59, 130, 246, 0.75)';

        ctx.stroke();
        ctx.restore();
      },
    };


  // ============================
  // Chart Options
  // ============================

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,

    animation: {
      duration: 450,
    },

    interaction: {
      mode: 'index',
      intersect: false,
    },

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        enabled: true,
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        displayColors: false,

        callbacks: {
          title: (items) => {
            const index = items[0]?.dataIndex;

            return index === undefined
              ? ''
              : `Founded Year: ${visibleGrowth[index]?.year ?? ''}`;
          },

          label: (context) => {
            const point = visibleGrowth[context.dataIndex];

            return point
              ? `Cumulative: ${numberFormatter.format(
                  point.cumulativeCompanies,
                )} companies`
              : '';
          },

          afterLabel: (context) => {
            const point = visibleGrowth[context.dataIndex];

            return point
              ? `New in year: ${numberFormatter.format(
                  point.newCompanies,
                )} companies`
              : '';
          },
        },
      },
    },


    scales: {
      x: {
        grid: {
          display: false,
        },

        border: {
          display: false,
        },

        ticks: {
          color: theme.palette.text.secondary,
          autoSkip: false,
          align: 'inner',
          maxRotation: 0,
          padding: 8,

          callback: (_value, index) => {
            if (!xTickIndices.has(index)) {
              return '';
            }

            return String(visibleGrowth[index]?.year ?? '');
          },
        },
      },

      y: {
        beginAtZero: true,

        border: {
          display: false,
        },

        grid: {
          display: true,
          drawOnChartArea: false,
          drawTicks: false,
        },

        ticks: {
          color: theme.palette.text.secondary,
          precision: 0,
          maxTicksLimit: 6,
          callback: (value) =>
            numberFormatter.format(Number(value)),
        },
      },
    },

  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        height: '100%',
        minWidth: 0,
        minHeight: 330,
        bgcolor: 'background.paper',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack
        spacing={2}
        sx={{
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          sx={{
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
          spacing={2}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Company Growth
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Cumulative companies by founded year
            </Typography>
          </Box>

          {lastPoint && (
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: LINE_COLOR,
                  lineHeight: 1.2,
                }}
              >
                {numberFormatter.format(
                  lastPoint.cumulativeCompanies,
                )}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </Box>
          )}
        </Stack>


        {/* Dynamic Year Range Controls */}
        {validGrowth.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              flexWrap: 'wrap',
            }}
          >
            {/* Selected year range */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {firstVisibleYear} – {latestYear}
            </Typography>

            {/* Keep your existing ToggleButtonGroup below */}
            <ToggleButtonGroup
              value={range}
              exclusive
              size="small"
              aria-label="Company growth year range"
              onChange={(_, nextRange: GrowthRange | null) => {
                if (nextRange !== null) {
                  setRange(nextRange);
                }
              }}
              sx={{
                '& .MuiToggleButton-root': {
                  px: { xs: 0.75, sm: 1.5 },
                  py: 0.5,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                },
              }}
            >
              <ToggleButton value="all">
                All
              </ToggleButton>

              <ToggleButton value="30y">
                Last 30 Years
              </ToggleButton>

              <ToggleButton value="10y">
                Last 10 Years
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}


        {/* Chart */}
        {validGrowth.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              minHeight: 250,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography color="text.secondary">
              No growth data available.
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                flex: 1,
                minHeight: 220,
              }}
            >
              <Line
                data={chartData}
                options={options}
                plugins={[hoverGuidePlugin]}
              />
            </Box>


          </>
        )}
      </Stack>
    </Paper>
  );
}
