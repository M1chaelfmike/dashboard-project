
'use client';

import { useRef, useState } from 'react';

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

export default function CompanyPage() {
  // Authentication and permissions
  const { user, isLoading: authLoading, refreshUser } = useAuth();

  const permissions = getCompanyPermissions(user);

  const companyList = useCompanies();
  const [refreshingAccess, setRefreshingAccess] = useState(false);
  const accessRefreshInFlight = useRef(false);

  const handleRetryAccess = async () => {
    if (accessRefreshInFlight.current || companyList.loading) return;

    accessRefreshInFlight.current = true;
    setRefreshingAccess(true);

    try {
      const currentUser = await refreshUser();
      if (getCompanyPermissions(currentUser).canView) companyList.refresh();
    } catch {
      // The authentication provider and dashboard layout display identity errors.
    } finally {
      accessRefreshInFlight.current = false;
      setRefreshingAccess(false);
    }
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!permissions.canView) {
    return (
      <Alert severity="warning">
        You do not have permission to view companies.
      </Alert>
    );
  }

  if (refreshingAccess || companyList.errorStatus === 401 || companyList.errorStatus === 403) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
          Company
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {companyList.error || 'Company access must be verified before continuing.'}
        </Alert>
        <Button onClick={handleRetryAccess} disabled={refreshingAccess || companyList.loading}>
          Retry
        </Button>
      </Box>
    );
  }

  // Unmount the content on access denial so stale dialogs cannot reopen later.
  return <CompanyListContent permissions={permissions} companyList={companyList} />;
}

function CompanyListContent({ permissions, companyList }: {
  permissions: ReturnType<typeof getCompanyPermissions>;
  companyList: ReturnType<typeof useCompanies>;
}) {
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
  } = companyList;

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCompany, setEditingCompany] =
    useState<Company | null>(null);

  const [deletingCompany, setDeletingCompany] =
    useState<Company | null>(null);

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const deleteInFlight = useRef(false);

  // Delete company
  const handleDeleteCompany = async () => {
    if (!permissions.canDelete || !deletingCompany || deleteInFlight.current) return;

    deleteInFlight.current = true;
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
      deleteInFlight.current = false;
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
        onEditCompany={(company) => {
          if (permissions.canUpdate && !deleteInFlight.current) setEditingCompany(company);
        }}
        onDeleteCompany={(company) => {
          if (!permissions.canDelete || deleteInFlight.current) return;
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
