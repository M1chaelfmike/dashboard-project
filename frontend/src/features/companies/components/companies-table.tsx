
'use client';

import {
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Box,
  Collapse,
  ChipProps,
} from '@mui/material';

import { Fragment, useState } from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

import { COMPANY_LEVEL_COLORS } from '@/features/companies/constants';
import DataTablePagination from '@/components/common/data-table-pagination';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/Delete';

import type { Company } from '@/lib/api/companies';

interface CompaniesTableProps {
  companies: Company[];
  total: number;

  page: number;
  pageSize: number;

  loading: boolean;
  canManage: boolean;
  mutationPending?: boolean;

  onEditCompany: (company: Company) => void;
  onDeleteCompany: (company: Company) => void;

  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const LEVEL_COLORS: Record<number, ChipProps['color']> = {
  1: 'primary',
  2: 'info',
  3: 'success',
  4: 'default',
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatEfficiency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getEfficiencyStyles(value: number | null) {
  if (value === null) {
    return {
      bgcolor: '#475569',
      color: '#F8FAFC',
      border: '1px solid #64748B',
    };
  }

  // High: >= 200
  if (value >= 200) {
    return {
      bgcolor: '#86EFAC',
      color: '#14532D',
      border: '1px solid #4ADE80',
    };
  }

  // Medium: 100 - 199.99
  if (value >= 100) {
    return {
      bgcolor: '#FDE047',
      color: '#713F12',
      border: '1px solid #FACC15',
    };
  }

  // Low: < 100
  return {
    bgcolor: '#FCA5A5',
    color: '#7F1D1D',
    border: '1px solid #F87171',
  };
}

export default function CompaniesTable({
  companies,
  total,
  page,
  pageSize,
  loading,
  canManage,
  mutationPending = false,
  onEditCompany,
  onDeleteCompany,
  onPageChange,
  onPageSizeChange,
}: CompaniesTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleExpanded = (companyCode: string) => {
    setExpandedRows((previous) => {
      const next = new Set(previous);

      if (next.has(companyCode)) {
        next.delete(companyCode);
      } else {
        next.add(companyCode);
      }

      return next;
    });
  };
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3 }}>
      <TableContainer>

        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Company</strong>
              </TableCell>

              <TableCell>
                <strong>Level</strong>
              </TableCell>

              <TableCell>
                <strong>Country</strong>
              </TableCell>

              <TableCell align="center">
                <strong>Revenue Efficiency</strong>
              </TableCell>

              <TableCell align="right">
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={28} sx={{ my: 4 }} />
                </TableCell>
              </TableRow>
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary" sx={{ py: 5 }}>
                    No companies found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => {
                const expanded = expandedRows.has(company.companyCode);

                return (
                  <Fragment key={company.companyCode}>
                    {/* Main Row */}
                    <TableRow hover>
                      {/* Company */}
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: 'center' }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => toggleExpanded(company.companyCode)}
                            aria-label={
                              expanded
                                ? `Collapse ${company.companyName}`
                                : `Expand ${company.companyName}`
                            }
                            aria-expanded={expanded}
                            aria-controls={`company-details-${company.companyCode}`}
                          >
                            {expanded ? (
                              <KeyboardArrowDownIcon />
                            ) : (
                              <KeyboardArrowRightIcon />
                            )}
                          </IconButton>

                          <Stack spacing={0.3}>
                            <Typography sx={{ fontWeight: 600 }}>
                              {company.companyName}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {company.companyCode}
                            </Typography>
                          </Stack>
                        </Stack>
                      </TableCell>

                      {/* Level */}
                      <TableCell>
                        <Chip
                          label={`Level ${company.level}`}
                          size="small"
                          color={
                            COMPANY_LEVEL_COLORS[company.level] ?? 'default'
                          }
                          variant="outlined"
                        />
                      </TableCell>

                      {/* Country */}
                      <TableCell>
                        {company.country}
                      </TableCell>

                      {/* Revenue Efficiency */}
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 85,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1.5,
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            ...getEfficiencyStyles(company.revenueEfficiency),
                          }}
                        >
                          {company.revenueEfficiency === null
                            ? '—'
                            : formatEfficiency(company.revenueEfficiency)}
                        </Box>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                          }}
                        >


                          {canManage && (
                            <>
                              <Tooltip title="Edit Company">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    disabled={mutationPending}
                                    onClick={() => onEditCompany(company)}
                                    aria-label={`Edit ${company.companyName}`}
                                  >
                                    <EditOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>

                              <Tooltip title="Delete Company">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    disabled={mutationPending}
                                    onClick={() => onDeleteCompany(company)}
                                    aria-label={`Delete ${company.companyName}`}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {/* Collapsible Details */}
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        sx={{
                          py: 0,
                          borderBottom: expanded ? undefined : 0,
                        }}
                      >
                        <Collapse
                          in={expanded}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box
                            id={`company-details-${company.companyCode}`}
                            sx={{
                              my: 1.5,
                              mx: 2,
                              p: 2.5,
                              bgcolor: 'action.hover',
                              borderRadius: 2,
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{ mb: 2, fontWeight: 700 }}
                            >
                              Company Details
                            </Typography>

                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                  xs: 'repeat(2, minmax(0, 1fr))',
                                  md: 'repeat(4, minmax(0, 1fr))',
                                },
                                gap: 2.5,
                              }}
                            >
                              {/* City */}
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  City
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {company.city}
                                </Typography>
                              </Box>

                              {/* Founded Year */}
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Founded Year
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {company.foundedYear}
                                </Typography>
                              </Box>

                              {/* Annual Revenue */}
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Annual Revenue
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {formatNumber(company.annualRevenue)}
                                </Typography>
                              </Box>

                              {/* Employees */}
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Employees
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {formatNumber(company.employees)}
                                </Typography>
                              </Box>

                              {/* Parent Company */}
                              <Box
                                sx={{
                                  gridColumn: {
                                    xs: '1 / -1',
                                    md: 'span 2',
                                  },
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Parent Company
                                </Typography>

                                {company.parentCompanyCode ? (
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{
                                      alignItems: 'center',
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {company.parentCompanyName ?? '—'}
                                    </Typography>

                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {company.parentCompanyCode}
                                    </Typography>

                                    {company.parentCompanyLevel != null && (
                                      <Chip
                                        label={`Level ${company.parentCompanyLevel}`}
                                        size="small"
                                        variant="outlined"
                                        color={
                                          COMPANY_LEVEL_COLORS[
                                            company.parentCompanyLevel
                                          ] ?? 'default'
                                        }
                                        sx={{
                                          height: 20,
                                          fontSize: '0.65rem',
                                          '& .MuiChip-label': {
                                            px: 0.75,
                                          },
                                        }}
                                      />
                                    )}
                                  </Stack>
                                ) : (
                                  <Typography variant="body2">
                                    —
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>

      </TableContainer>

      <DataTablePagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </Paper>
  );
}
