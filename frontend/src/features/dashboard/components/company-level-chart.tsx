
'use client';

import { useMemo, useRef, useState } from 'react';

import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  type ChartOptions,
} from 'chart.js';

import { Doughnut } from 'react-chartjs-2';

import type {
  CompanyLevelDistribution,
} from '@/lib/api/dashboard';

ChartJS.register(ArcElement, ChartTooltip);

const COLORS: Record<number, string> = {
  1: '#A78BFA',
  2: '#F5B84B',
  3: '#2DD4BF',
  4: '#5B9CF6',
};

const formatNumber = new Intl.NumberFormat('en-US');

interface Props {
  distribution: CompanyLevelDistribution[];
  totalCompanies: number;
}

export default function CompanyLevelChart({
  distribution,
  totalCompanies,
}: Props) {
  const theme = useTheme();

  const chartRef = useRef<ChartJS<'doughnut'> | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const levels = useMemo(
    () => [...distribution].sort((a, b) => a.level - b.level),
    [distribution],
  );

  // The currently hovered level, if any.
  const activeLevel =
    hoveredIndex === null
      ? null
      : levels[hoveredIndex] ?? null;

  const getColor = (level: number) =>
    COLORS[level] ?? '#94A3B8';

  const chartData = useMemo(
    () => ({
      labels: levels.map((item) => `Level ${item.level}`),
      datasets: [
        {
          data: levels.map((item) => item.count),
          backgroundColor: levels.map((item) => getColor(item.level)),
          borderWidth: 0,
          borderRadius: 2,
          spacing: 1,
          hoverOffset: 5,
        },
      ],
    }),
    [levels],
  );

  const options = useMemo<ChartOptions<'doughnut'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '76%',
      animation: { duration: 400 },

      onHover: (_event, elements) => {
        setHoveredIndex(elements[0]?.index ?? null);
      },

      plugins: {
        legend: { display: false },

        tooltip: {
          enabled: false,
          backgroundColor: theme.palette.background.paper,
          titleColor: theme.palette.text.primary,
          bodyColor: theme.palette.text.secondary,
          borderColor: theme.palette.divider,
          borderWidth: 1,
          padding: 10,

          callbacks: {
            label: (context) => {
              const item = levels[context.dataIndex];
              if (!item) return '';

              return (
                `${formatNumber.format(item.count)} companies` +
                ` (${item.percentage.toFixed(2)}%)`
              );
            },
          },
        },
      },
    }),
    [levels, theme],
  );

  function highlightLevel(index: number | null) {
    setHoveredIndex(index);

    const chart = chartRef.current;
    if (!chart) return;

    chart.setActiveElements(
      index === null
        ? []
        : [{ datasetIndex: 0, index }],
    );

    chart.update('none');
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        height: '100%',
        minWidth: 0,
        borderColor: 'divider',
        bgcolor: 'background.paper',
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
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Company Distribution
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Companies by supply chain level
          </Typography>
        </Box>

        {totalCompanies === 0 ? (
          <Typography color="text.secondary">
            No company data available.
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                lg: 'minmax(0, 1fr) minmax(0, 1fr)',
                flex: 1,
                alignContent: 'center',
                alignItems: 'center',
              },
              gap: 2,
              alignItems: 'center',
              minWidth: 0,
            }}
          >
            {/* Compact Doughnut */}
            <Stack
              sx={{ alignItems: 'center',
                    minWidth: 0
               }}
              spacing={1}

            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 260,
                  aspectRatio: '1 / 1',
                  flexShrink: 0,
                }}
              >
                <Doughnut
                  ref={chartRef}
                  data={chartData}
                  options={options}
                />


                <Stack
                  spacing={0.2}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  {/* Company count */}

                  <Typography
                    sx={{
                      fontSize: '2.25rem',
                      fontWeight: 800,
                      lineHeight: 1.15,
                      letterSpacing: '-0.04em',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatNumber.format(
                      activeLevel?.count ?? totalCompanies,
                    )}
                  </Typography>


                  {/* Level label */}
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: activeLevel ? 700 : 500,
                      color: activeLevel
                        ? getColor(activeLevel.level)
                        : 'text.secondary',
                    }}
                  >
                    {activeLevel
                      ? `Level ${activeLevel.level}`
                      : 'Companies'}
                  </Typography>

                  {/* Percentage: reserve space to avoid layout jumping */}
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      minHeight: '1rem',
                      color: 'text.secondary',
                      visibility: activeLevel ? 'visible' : 'hidden',
                    }}
                  >
                    {activeLevel
                      ? `${activeLevel.percentage.toFixed(2)}% of total`
                      : '100% of total'}
                  </Typography>
                </Stack>

              </Box>


            </Stack>

            {/* Compact Data Table */}
            <Box sx={{ minWidth: 0, overflowX: 'auto' }}>
              <Table
                size="small"
                sx={{
                  width: '100%',
                  minWidth: 0,
                  '& .MuiTableCell-root': {
                    px: 1,
                    py: 1.1,
                    borderColor: 'divider',
                  },
                }}
              >

                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontSize: '0.9375rem',
                        fontWeight: 700,
                        color: 'text.primary',
                      }}
                    >
                      Level
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontSize: '0.9375rem',
                        fontWeight: 700,
                        color: 'text.primary',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Companies · Share
                    </TableCell>
                  </TableRow>
                </TableHead>


                <TableBody>
                  {levels.map((item, index) => {
                    const color = getColor(item.level);
                    const active = hoveredIndex === index;

                    return (
                      <TableRow
                        key={item.level}
                        hover
                        onMouseEnter={() => highlightLevel(index)}
                        onMouseLeave={() => highlightLevel(null)}
                        sx={{
                          cursor: 'pointer',
                          transition: 'background-color 150ms ease',

                          bgcolor: active
                            ? alpha(color, 0.12)
                            : 'transparent',

                          '&:hover': {
                            bgcolor: alpha(color, 0.16),
                          },
                        }}
                      >
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0.8}
                            sx={{ alignItems: 'center' }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: color,
                                flexShrink: 0,
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '0.9375rem',
                                fontWeight: active ? 700 : 500,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Level {item.level}
                            </Typography>
                          </Stack>
                        </TableCell>


                        <TableCell
                          align="right"
                          sx={{
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {/* Combined count and share */}
                          <Stack
                            direction="row"
                            spacing={0.8}
                            sx={{
                              alignItems: 'baseline',
                              justifyContent: 'flex-end',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '1rem',
                                fontWeight: 700,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {formatNumber.format(item.count)}
                            </Typography>

                            <Typography
                              variant="caption"
                              sx={{
                                color: active ? color : 'text.secondary',
                                fontWeight: active ? 700 : 500,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              ({item.percentage.toFixed(2)}%)
                            </Typography>
                          </Stack>

                          {/* Share progress indicator */}
                          <Box
                            sx={{
                              height: 4,
                              width: 90,
                              ml: 'auto',
                              mt: 0.8,
                              borderRadius: 2,
                              bgcolor: 'action.hover',
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                height: '100%',
                                width: `${Math.max(
                                  0,
                                  Math.min(100, item.percentage),
                                )}%`,
                                minWidth: item.count > 0 ? 2 : 0,
                                borderRadius: 2,
                                bgcolor: color,
                              }}
                            />
                          </Box>
                        </TableCell>

                      </TableRow>
                    );
                  })}


                  <TableRow
                    sx={{
                      '& .MuiTableCell-root': {
                        fontSize: '1rem',
                        fontWeight: 800,
                        borderBottom: 0,
                        fontVariantNumeric: 'tabular-nums',
                      },
                    }}
                  >
                    <TableCell>Total</TableCell>

                    <TableCell align="right">
                      {formatNumber.format(totalCompanies)} (100%)
                    </TableCell>
                  </TableRow>

                </TableBody>
              </Table>
            </Box>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
