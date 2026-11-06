'use client';

import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';

import type { UserRole, UserStatus } from '@/lib/api/auth';

interface UserFiltersProps {
  search: string;
  roles: UserRole[];
  statuses: UserStatus[];

  onSearchChange: (value: string) => void;
  onRolesChange: (value: UserRole[]) => void;
  onStatusesChange: (value: UserStatus[]) => void;
}

const ROLE_OPTIONS: UserRole[] = [
  'ADMIN',
  'MEMBER',
];

const STATUS_OPTIONS: UserStatus[] = [
  'PENDING_APPROVAL',
  'ACTIVE',
  'SUSPENDED',
  'REJECTED',
];

export default function UserFilters({
  search,
  roles,
  statuses,
  onSearchChange,
  onRolesChange,
  onStatusesChange,
}: UserFiltersProps) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{ width: '100%' }}
    >
      {/* Search */}
      <TextField
        fullWidth
        size="small"
        label="Search by name"
        placeholder="Enter user name..."
        value={search}
        onChange={(event) =>
          onSearchChange(event.target.value)
        }
      />

      {/* Role Filter */}
      <FormControl
        size="small"
        sx={{ minWidth: { xs: '100%', md: 180 } }}
      >
        <InputLabel id="user-role-filter-label">
          Role
        </InputLabel>

        <Select
          labelId="user-role-filter-label"
          multiple
          value={roles}
          label="Role"
          onChange={(event) => {
            const value = event.target.value;

            onRolesChange(
              typeof value === 'string'
                ? value.split(',') as UserRole[]
                : value as UserRole[],
            );
          }}
          renderValue={(selected) =>
            selected.length
              ? selected.join(', ')
              : 'All roles'
          }
        >
          {ROLE_OPTIONS.map((role) => (
            <MenuItem key={role} value={role}>
              <Checkbox checked={roles.includes(role)} />
              <ListItemText primary={role} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Status Filter */}
      <FormControl
        size="small"
        sx={{ minWidth: { xs: '100%', md: 200 } }}
      >
        <InputLabel id="user-status-filter-label">
          Status
        </InputLabel>

        <Select
          labelId="user-status-filter-label"
          multiple
          value={statuses}
          label="Status"
          onChange={(event) => {
            const value = event.target.value;

            onStatusesChange(
              typeof value === 'string'
                ? value.split(',') as UserStatus[]
                : value as UserStatus[],
            );
          }}
          renderValue={(selected) =>
            selected.length
              ? selected.join(', ')
              : 'All statuses'
          }
        >
          {STATUS_OPTIONS.map((status) => (
            <MenuItem key={status} value={status}>
              <Checkbox
                checked={statuses.includes(status)}
              />
              <ListItemText primary={status} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}