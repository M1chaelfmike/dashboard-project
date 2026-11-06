'use client';

import {
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import DataTablePagination from '@/components/common/data-table-pagination';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';

import type { ChipProps } from '@mui/material';

import type {
  AuthUser,
  UserStatus,
} from '@/lib/api/auth';

import {
  canManageUsers,
  getDeleteDisabledReason,
  getStatusActionDisabledReason,
  isCurrentUser,
  USER_ROLE_DESCRIPTIONS,
  USER_STATUS_ACCESS,
  USER_STATUS_ACTION_LABELS,
  type UserStatusAction,
} from '@/features/users/permissions';

interface UsersTableProps {
  users: AuthUser[];
  total: number;

  page: number;
  pageSize: number;

  selectedIds: string[];
  loading: boolean;
  currentUser: AuthUser | null;
  mutationPending?: boolean;
  onEditUser: (user: AuthUser) => void;
  onDeleteUser: (user: AuthUser) => void;
  onChangeStatus: (user: AuthUser, action: UserStatusAction) => void;

  onSelectUser: (id: string) => void;
  onSelectAll: () => void;

  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const STATUS_CONFIG: Record<
  UserStatus,
  {
    label: string;
    color: ChipProps['color'];
  }
> = {
  ACTIVE: {
    label: 'Active',
    color: 'success',
  },
  PENDING_APPROVAL: {
    label: 'Pending',
    color: 'warning',
  },
  SUSPENDED: {
    label: 'Suspended',
    color: 'error',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'default',
  },
};

const STATUS_ACTIONS: Record<UserStatus, UserStatusAction[]> = {
  PENDING_APPROVAL: ['approve', 'reject'],
  ACTIVE: ['suspend'],
  SUSPENDED: ['reactivate'],
  REJECTED: [],
};

const ACTION_ICONS = {
  approve: <CheckCircleOutlinedIcon fontSize="small" />,
  reject: <HighlightOffIcon fontSize="small" />,
  suspend: <PauseCircleOutlinedIcon fontSize="small" />,
  reactivate: <PlayCircleOutlinedIcon fontSize="small" />,
};

const ACTION_COLORS = {
  approve: 'success',
  reject: 'error',
  suspend: 'warning',
  reactivate: 'success',
} as const;

export default function UsersTable({
  users,
  total,
  page,
  pageSize,
  selectedIds,
  loading,
  currentUser,
  mutationPending = false,
  onSelectUser,
  onSelectAll,
  onPageChange,
  onPageSizeChange,
  onEditUser,
  onDeleteUser,
  onChangeStatus,
}: UsersTableProps) {
  const busy = loading || mutationPending;
  const manager = canManageUsers(currentUser);
  const selectableUsers = users.filter(user => getDeleteDisabledReason(currentUser, user) === null);
  const allSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((user) =>
      selectedIds.includes(user.id),
    );

  const someSelected =
    selectableUsers.some((user) =>
      selectedIds.includes(user.id),
    ) && !allSelected;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3 }}>
      <TableContainer>
        <Table sx={{ minWidth: 1000 }} aria-label="Users and access permissions">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Tooltip title={manager
                  ? 'Select users eligible for deletion on this page. Your account is excluded.'
                  : 'Administrator access is required.'}>
                  <Box component="span" sx={{ display: 'inline-flex' }}>
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={() => {
                        if (!busy && selectableUsers.length > 0) onSelectAll();
                      }}
                      disabled={busy || selectableUsers.length === 0}
                      slotProps={{
                        input: {
                          'aria-label': 'Select all users eligible for deletion on this page',
                        },
                      }}
                    />
                  </Box>
                </Tooltip>
              </TableCell>

              <TableCell>
                <strong>Name</strong>
              </TableCell>

              <TableCell>
                <strong>Email</strong>
              </TableCell>

              <TableCell>
                <strong>Role</strong>
              </TableCell>

              <TableCell>
                <strong>Status</strong>
              </TableCell>

              <TableCell align="right">
                <strong>Actions</strong>
              </TableCell>


            </TableRow>
          </TableHead>

          <TableBody>
            {loading && users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={28} sx={{ my: 4 }} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography
                    color="text.secondary"
                    sx={{ py: 5 }}
                  >
                    No users found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const status =
                  STATUS_CONFIG[user.status];
                const ownAccount = isCurrentUser(currentUser, user);
                const deleteDisabledReason = getDeleteDisabledReason(currentUser, user);
                const selectable = deleteDisabledReason === null;
                const selected = selectable && selectedIds.includes(user.id);

                return (
                  <TableRow
                    key={user.id}
                    hover
                    selected={selected}
                  >
                    <TableCell padding="checkbox">
                      <Tooltip title={deleteDisabledReason ?? `Select ${user.email} for deletion`}>
                        <Box component="span" sx={{ display: 'inline-flex' }}>
                          <Checkbox
                            checked={selected}
                            disabled={busy || !selectable}
                            onChange={() => {
                              if (!busy && selectable) onSelectUser(user.id);
                            }}
                            slotProps={{
                              input: {
                                'aria-label': `Select ${user.email} for deletion`,
                              },
                            }}
                          />
                        </Box>
                      </Tooltip>
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 600 }}>
                          {user.name?.trim() || 'Unnamed User'}
                        </Typography>
                        {ownAccount && <Chip label="You" size="small" variant="outlined" />}
                      </Stack>
                    </TableCell>

                    <TableCell
                      sx={{
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {user.email}
                    </TableCell>

                    <TableCell>
                      <Tooltip title={USER_ROLE_DESCRIPTIONS[user.role]}>
                      <Chip
                        label={user.role}
                        size="small"
                        color={user.role === 'ADMIN' ? 'primary' : 'default'}
                        variant="outlined"
                      />
                      </Tooltip>
                    </TableCell>

                    <TableCell>
                      <Tooltip title={USER_STATUS_ACCESS[user.status]}>
                      <Chip
                        label={status.label}
                        size="small"
                        color={status.color}
                      />
                      </Tooltip>
                    </TableCell>

                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ justifyContent: 'flex-end' }}
                      >
                        {STATUS_ACTIONS[user.status].map(action => {
                          const reason = getStatusActionDisabledReason(currentUser, user, action);
                          const label = USER_STATUS_ACTION_LABELS[action];
                          return (
                            <Tooltip key={action} title={reason ?? `${label} user`}>
                              <Box component="span" sx={{ display: 'inline-flex' }}>
                                <IconButton
                                  size="small"
                                  color={ACTION_COLORS[action]}
                                  disabled={busy || reason !== null}
                                  onClick={() => {
                                    if (!busy && reason === null) onChangeStatus(user, action);
                                  }}
                                  aria-label={`${label} ${user.email}`}
                                >
                                  {ACTION_ICONS[action]}
                                </IconButton>
                              </Box>
                            </Tooltip>
                          );
                        })}
                        {/* Edit */}
                        <Tooltip title={manager ? 'Edit user details and role' : 'Administrator access is required.'}>
                          <Box component="span" sx={{ display: 'inline-flex' }}>
                            <IconButton
                              size="small"
                              color="primary"
                              disabled={busy || !manager}
                              onClick={() => {
                                if (!busy && manager) onEditUser(user);
                              }}
                              aria-label={`Edit ${user.email}`}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Tooltip>

                        {/* Delete */}
                        <Tooltip title={deleteDisabledReason ?? 'Delete user'}>
                          <Box component="span" sx={{ display: 'inline-flex' }}>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={busy || !selectable}
                              onClick={() => {
                                if (!busy && selectable) onDeleteUser(user);
                              }}
                              aria-label={`Delete ${user.email}`}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
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
        disabled={busy}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </Paper>
  );
}
