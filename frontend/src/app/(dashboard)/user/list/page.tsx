'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Alert,
  Stack,
  Button,
  Typography,
  Box,
  Paper,
  CircularProgress,
} from '@mui/material';
import type { AlertColor } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAuth } from '@/features/auth/use-auth';
import { ApiError } from '@/lib/api/client';
import {
  canManageUsers,
  getDeleteDisabledReason,
  getStatusActionDisabledReason,
  isCurrentUser,
  USER_STATUS_ACTION_LABELS,
  type UserStatusAction,
} from '@/features/users/permissions';
import UserStatusDialog from '@/features/users/components/user-status-dialog';

import type { AuthUser } from '@/lib/api/auth';
import DeleteIcon from '@mui/icons-material/Delete';

import EditUserDialog from
  '@/features/users/components/edit-user-dialog';

import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';

import CreateUserDialog from '@/features/users/components/create-user-dialog';

import UserFilters from '@/features/users/components/user-filters';

import UsersTable from '@/features/users/components/users-table';

import { useUsers, } from '@/features/users/hooks/use-users';

import {
  deleteUser,
  deleteUsers,
  changeUserStatus,
} from '@/lib/api/users';

import DeleteUserDialog from
  '@/features/users/components/delete-user-dialog'

export default function UserPage() {
  const router = useRouter();
  const { user: currentUser, status: authStatus, refreshUser } = useAuth();
  const canManage = canManageUsers(currentUser);
  const {
    searchInput,
    roles,
    statuses,
    page,
    pageSize,

    users,
    total,

    loading,
    error,
    errorStatus,

    refresh,

    updateSearch,
    updateRoles,
    updateStatuses,
    updatePage,
    updatePageSize,
  } = useUsers(canManage);

  const [createDialogOpen, setCreateDialogOpen] =
    useState(false);

  const [editingUser, setEditingUser] =
    useState<AuthUser | null>(null);

  const [deletingUser, setDeletingUser] =
    useState<AuthUser | null>(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState('');

  const [bulkDeleteOpen, setBulkDeleteOpen] =
    useState(false);

  const [bulkDeleteLoading, setBulkDeleteLoading] =
    useState(false);

  const [bulkDeleteError, setBulkDeleteError] =
    useState('');

  const [selection, setSelectedIds] =
    useState<string[]>([]);

  const [statusChange, setStatusChange] = useState<{
    user: AuthUser;
    action: UserStatusAction;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [notice, setNotice] = useState<{ severity: AlertColor; message: string } | null>(null);
  const [refreshingAccess, setRefreshingAccess] = useState(false);
  const accessRefreshInFlight = useRef(false);
  const mutationPending = deleteLoading || bulkDeleteLoading || statusLoading;
  const busy = mutationPending || loading;
  const selectedIds = users.filter(user =>
    selection.includes(user.id) && getDeleteDisabledReason(currentUser, user) === null,
  ).map(user => user.id);

  const reconcileMutationError = (error: unknown, close: () => void): boolean => {
    if (!(error instanceof ApiError)) return false;
    if (error.status === 404 || error.status === 409) {
      close();
      setSelectedIds([]);
      setNotice({ severity: 'warning', message: `${error.message} The list has been refreshed; review the current account before trying again.` });
      refresh();
      return true;
    }
    // A fresh list request distinguishes revoked access from a rejected operation.
    if (error.status === 401 || error.status === 403) refresh();
    return false;
  };

  const handleSelectUser = (id: string) => {
    const target = users.find(user => user.id === id);
    if (busy || !target || getDeleteDisabledReason(currentUser, target)) return;
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  };

  const handleUserUpdated = () => {
    setSelectedIds([]);
    setNotice({ severity: 'success', message: 'User information and permissions updated.' });
    refresh();
    if (editingUser && isCurrentUser(currentUser, editingUser)) {
      void refreshUser().catch(() => { /* Authentication errors are handled by the layout. */ });
    }
  };

  const handleOpenDelete = (user: AuthUser) => {
    if (busy || getDeleteDisabledReason(currentUser, user)) return;
    setDeletingUser(user);
    setDeleteError('');
  };

  // Close delete dialog
  const handleCloseDelete = () => {
    if (deleteLoading) return;

    setDeletingUser(null);
    setDeleteError('');
  };

  // Confirm single deletion
  const handleConfirmDelete = async () => {
    if (!deletingUser || busy) return;
    const reason = getDeleteDisabledReason(currentUser, deletingUser);
    if (reason) {
      setDeleteError(reason);
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      await deleteUser(deletingUser.id);

      // Check whether current page becomes empty
      const shouldMovePreviousPage =
        users.length === 1 && page > 0;

      setDeletingUser(null);
      setSelectedIds([]);
      setNotice({ severity: 'success', message: 'User deleted.' });

      if (shouldMovePreviousPage) {
        updatePage(page - 1);
      }

      refresh();

    } catch (error: unknown) {
      if (reconcileMutationError(error, () => setDeletingUser(null))) return;
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Failed to delete user.',
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // Open bulk delete dialog
  const handleOpenBulkDelete = () => {
    if (busy || !canManage || selectedIds.length === 0) return;

    setBulkDeleteError('');
    setBulkDeleteOpen(true);
  };

  // Close bulk delete dialog
  const handleCloseBulkDelete = () => {
    if (bulkDeleteLoading) return;

    setBulkDeleteOpen(false);
    setBulkDeleteError('');
  };

  // Confirm bulk deletion
  const handleConfirmBulkDelete = async () => {
    if (busy || !canManage) return;
    const idsToDelete = [...selectedIds];

    if (idsToDelete.length === 0) {
      setBulkDeleteOpen(false);
      return;
    }
    if (idsToDelete.length > 100) {
      setBulkDeleteError('Select no more than 100 users at a time.');
      return;
    }

    setBulkDeleteLoading(true);
    setBulkDeleteError('');

    try {
      await deleteUsers(idsToDelete);

      const remainingUsersOnPage = users.filter(
        (user) => !idsToDelete.includes(user.id),
      ).length;

      setBulkDeleteOpen(false);
      setSelectedIds([]);
      setNotice({ severity: 'success', message: `${idsToDelete.length} user(s) deleted.` });

      if (remainingUsersOnPage === 0 && page > 0) {
        updatePage(page - 1);
      } else {
        refresh();
      }

    } catch (error: unknown) {
      if (reconcileMutationError(error, () => setBulkDeleteOpen(false))) return;
      setBulkDeleteError(
        error instanceof Error
          ? error.message
          : 'Failed to delete selected users.',
      );
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (busy || !canManage) return;
    const currentIds = users.filter(user => getDeleteDisabledReason(currentUser, user) === null)
      .map((user) => user.id);

    const allSelected = currentIds.every((id) =>
      selectedIds.includes(id),
    );

    if (allSelected) {
      setSelectedIds((previous) =>
        previous.filter((id) => !currentIds.includes(id)),
      );
    } else {
      setSelectedIds((previous) =>
        [...new Set([...previous, ...currentIds])],
      );
    }
  };

  const handleOpenStatusChange = (user: AuthUser, action: UserStatusAction) => {
    if (busy || getStatusActionDisabledReason(currentUser, user, action)) return;
    setStatusChange({ user, action });
    setStatusError('');
  };

  const handleConfirmStatusChange = async () => {
    if (!statusChange || busy) return;
    const { user, action } = statusChange;
    const latest = users.find(item => item.id === user.id);
    if (!latest || latest.updatedAt !== user.updatedAt) {
      setStatusChange(null);
      setSelectedIds([]);
      setNotice({ severity: 'warning', message: 'This account has changed. Review the refreshed user list before trying again.' });
      refresh();
      return;
    }
    const reason = getStatusActionDisabledReason(currentUser, latest, action);
    if (reason) {
      setStatusError(reason);
      return;
    }
    setStatusLoading(true);
    setStatusError('');
    try {
      const response = await changeUserStatus(user.id, action);
      setStatusChange(null);
      setSelectedIds([]);
      setNotice({ severity: 'success', message: response.message });
      refresh();
    } catch (error: unknown) {
      if (reconcileMutationError(error, () => setStatusChange(null))) return;
      setStatusError(error instanceof Error ? error.message : `Failed to ${USER_STATUS_ACTION_LABELS[action].toLowerCase()} user.`);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSelectedIds([]);
    updateSearch(value);
  };

  const handleRolesChange = (value: typeof roles) => {
    setSelectedIds([]);
    updateRoles(value);
  };

  const handleStatusesChange = (
    value: typeof statuses,
  ) => {
    setSelectedIds([]);
    updateStatuses(value);
  };

  const handlePageChange = (value: number) => {
    setSelectedIds([]);
    updatePage(value);
  };

  const handlePageSizeChange = (value: number) => {
    setSelectedIds([]);
    updatePageSize(value);
  };

  const handleUserCreated = () => {
    setSelectedIds([]);
    updatePage(0);
    refresh();
    setNotice({ severity: 'success', message: 'User created with the assigned role and active access.' });
  };

  const handleRefreshAccess = async () => {
    if (accessRefreshInFlight.current) return;
    accessRefreshInFlight.current = true;
    setRefreshingAccess(true);
    try {
      const refreshedUser = await refreshUser();
      if (canManageUsers(refreshedUser)) {
        setSelectedIds([]);
        refresh();
      }
    } catch {
      // The dashboard layout displays authentication errors and retry controls.
    } finally {
      accessRefreshInFlight.current = false;
      setRefreshingAccess(false);
    }
  };

  if (authStatus === 'loading') {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  if (!canManage || errorStatus === 401 || errorStatus === 403) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 640 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>User Management</Typography>
        <Alert severity="warning">
          {errorStatus === 401
            ? 'Your session has expired. Refresh your access to sign in again.'
            : 'User management is available to active administrators only.'}
        </Alert>
        <Typography color="text.secondary">
          Members can view company data and manage their own profile. If your role or account status has changed, refresh your access.
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            disabled={refreshingAccess}
            onClick={() => { void handleRefreshAccess(); }}
          >{refreshingAccess ? 'Refreshing Access...' : 'Refresh Access'}</Button>
          {currentUser?.role === 'MEMBER' && currentUser.status === 'ACTIVE' && (
            <Button onClick={() => router.push('/user/profile')}>Go to My Profile</Button>
          )}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'flex-start' },
          width: '100%',
          gap: 2,
        }}
      >
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            User Management
          </Typography>

          <Typography color="text.secondary">
            Manage registered users and their access permissions.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap sx={{ flexShrink: 0, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          disabled={busy}
          onClick={() => { setSelectedIds([]); refresh(); }}
        >Refresh</Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<PersonAddAlt1Icon />}
          onClick={() => setCreateDialogOpen(true)}
          disabled={busy}
          sx={{
            height: 40,
            px: 2,
            minWidth: 'auto',
            flexShrink: 0,
            borderRadius: 2,
            whiteSpace: 'nowrap',
          }}
        >
          Add User
        </Button>
        </Stack>
      </Box>


      {notice && <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert>}

      {/* Filters */}
      <UserFilters
        search={searchInput}
        roles={roles}
        statuses={statuses}
        onSearchChange={handleSearchChange}
        onRolesChange={handleRolesChange}
        onStatusesChange={handleStatusesChange}
      />

      {/* Error */}
      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}

      {/* Selection Information */}
      <Typography
        variant="body2"
        color="text.secondary"
      >
        {selectedIds.length} user(s) selected. Your own account cannot be selected for deletion.
      </Typography>

      {selectedIds.length > 0 && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{
              alignItems: {
                xs: 'stretch',
                sm: 'center',
              },
              justifyContent: 'space-between',
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 600 }}
            >
              {selectedIds.length} user(s) selected
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              sx={{ justifyContent: "flex-end" }}
            >
              <Button
                size="small"
                color="inherit"
                onClick={() => setSelectedIds([])}
                disabled={busy}
              >
                Clear Selection
              </Button>

              <Button
                size="small"
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleOpenBulkDelete}
                disabled={busy}
              >
                Delete Selected ({selectedIds.length})
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Table */}
      <UsersTable
        users={users}
        total={total}
        page={page}
        pageSize={pageSize}
        selectedIds={selectedIds}
        loading={loading}
        currentUser={currentUser}
        mutationPending={mutationPending}
        onSelectUser={handleSelectUser}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEditUser={(user) => { if (canManage && !busy) setEditingUser(user); }}
        onDeleteUser={handleOpenDelete}
        onChangeStatus={handleOpenStatusChange}
      />
      <CreateUserDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={handleUserCreated}
        onAccessDenied={refresh}
      />
      <EditUserDialog
        open={editingUser !== null}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onUpdated={handleUserUpdated}
        onAccessDenied={refresh}
      />
      <DeleteUserDialog
        open={deletingUser !== null}
        title="Delete User?"
        description={
          deletingUser
            ? `Are you sure you want to delete ${
                deletingUser.name?.trim() ||
                deletingUser.email
              }? This action cannot be undone.`
            : ''
        }
        loading={deleteLoading}
        error={deleteError}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />
      <DeleteUserDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedIds.length} Users?`}
        description={
          `Are you sure you want to delete ${
            selectedIds.length
          } selected users? This action cannot be undone.`
        }
        loading={bulkDeleteLoading}
        error={bulkDeleteError}
        onClose={handleCloseBulkDelete}
        onConfirm={handleConfirmBulkDelete}
      />
      <UserStatusDialog
        user={statusChange?.user ?? null}
        action={statusChange?.action ?? null}
        open={statusChange !== null}
        loading={statusLoading || loading}
        error={statusError}
        onClose={() => { if (!statusLoading) { setStatusChange(null); setStatusError(''); } }}
        onConfirm={handleConfirmStatusChange}
      />
    </Stack>

  );
}
