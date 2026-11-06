
'use client';

import { useState, type ReactNode } from 'react';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,

} from '@mui/material';


import AddOutlinedIcon from '@mui/icons-material/AddOutlined';

import { useAuth } from '@/features/auth/use-auth';

import { useCompanies } from '@/features/companies/hooks/use-companies';
import { getCompanyPermissions } from '@/features/companies/permissions';

import CompanyFilters from '@/features/companies/components/company-filters';
import CompaniesTable from '@/features/companies/components/companies-table';
import CreateCompanyDialog from '@/features/companies/components/create-company-dialog';
import EditCompanyDialog from '@/features/companies/components/edit-company-dialog';
import DeleteCompanyDialog from '@/features/companies/components/delete-company-dialog';

import {
  deleteCompany,
} from '@/lib/api/companies';

import type {
  Company,
} from '@/lib/api/companies';

import { ApiError } from '@/lib/api/client';

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}



export default function CompanyPage() {
  // Authentication and permissions
  const { user, isLoading: authLoading } = useAuth();

  const permissions = getCompanyPermissions(user);

  // Company list
  const {
    searchInput,
    levels,
    page,
    pageSize,
    companies,
    total,
    loading,
    error,
    updateSearch,
    updateLevels,
    updatePage,
    updatePageSize,
    refresh,
  } = useCompanies();

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCompany, setEditingCompany] =
    useState<Company | null>(null);

  const [deletingCompany, setDeletingCompany] =
    useState<Company | null>(null);

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Wait for authentication restoration
  if (authLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 8,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Permission check
  if (!permissions.canView) {
    return (
      <Alert severity="warning">
        You do not have permission to view companies.
      </Alert>
    );
  }

  // Delete company
  const handleDeleteCompany = async () => {
    if (!deletingCompany || deleteLoading) return;

    setDeleteLoading(true);
    setDeleteError('');

    try {
      await deleteCompany(deletingCompany.companyCode);

      setDeletingCompany(null);
      refresh();
    } catch (error: unknown) {
      setDeleteError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to delete company.',
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: {
            xs: 'column',
            sm: 'row',
          },
          alignItems: {
            xs: 'stretch',
            sm: 'center',
          },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 700 }}
        >
          Company
        </Typography>

        {permissions.canCreate && (
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Create Company
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
        }}
      >
        <CompanyFilters
          search={searchInput}
          levels={levels}
          onSearchChange={updateSearch}
          onLevelsChange={updateLevels}
        />
      </Paper>

      {/* List Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Companies Table */}
      <CompaniesTable
        companies={companies}
        total={total}
        page={page}
        pageSize={pageSize}
        loading={loading}
        canManage={permissions.canManage}
        mutationPending={deleteLoading}
        onEditCompany={setEditingCompany}
        onDeleteCompany={(company) => {
          setDeleteError('');
          setDeletingCompany(company);
        }}
        onPageChange={updatePage}
        onPageSizeChange={updatePageSize}
      />

      {/* Create Company */}
      <CreateCompanyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          refresh();
        }}
      />

      {/* Edit Company */}
      {editingCompany && (
        <EditCompanyDialog
          key={editingCompany.companyCode}
          open={Boolean(editingCompany)}
          company={editingCompany}
          onClose={() => setEditingCompany(null)}
          onUpdated={() => {
            refresh();
          }}
        />
      )}

      {/* Delete Company */}
      <DeleteCompanyDialog
        open={Boolean(deletingCompany)}
        company={deletingCompany}
        loading={deleteLoading}
        error={deleteError}
        onClose={() => {
          if (deleteLoading) return;

          setDeletingCompany(null);
          setDeleteError('');
        }}
        onConfirm={handleDeleteCompany}
      />


    </Box>
  );
}
