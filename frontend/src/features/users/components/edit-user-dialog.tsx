
'use client';

import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { updateUser } from '@/lib/api/users';
import { ApiError } from '@/lib/api/client';
import { getValidationLength } from '@/lib/validation/string-length';
import { useAuth } from '@/features/auth/use-auth';
import {
  canChangeUserRole,
  canManageUsers,
  isCurrentUser,
  USER_ROLE_DESCRIPTIONS,
} from '../permissions';

import type {
  AuthUser,
  UserRole,
} from '@/lib/api/auth';

import type {
  UpdateUserRequest,
} from '@/lib/api/users';

interface EditUserDialogProps {
  open: boolean;
  user: AuthUser | null;
  onClose: () => void;
  onUpdated: () => void;
  onAccessDenied?: () => void;
}

interface FieldErrors {
  name?: string;
  email?: string;
}

export default function EditUserDialog(props: EditUserDialogProps) {
  if (!props.user) return null;

  return (
    <EditUserForm
      key={`${props.user.id}:${props.user.updatedAt}:${props.open}`}
      {...props}
      user={props.user}
    />
  );
}

function EditUserForm({
  open,
  user,
  onClose,
  onUpdated,
  onAccessDenied,
}: Omit<EditUserDialogProps, 'user'> & { user: AuthUser }) {
  const { user: operator } = useAuth();
  const canEdit = canManageUsers(operator);
  const editingSelf = user ? isCurrentUser(operator, user) : false;
  const canChangeRole = user ? canChangeUserRole(operator, user) : false;
  const [name, setName] = useState(user.name ?? '');
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<UserRole>(user.role);

  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors>({});

  const [serverError, setServerError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submissionInFlight = useRef(false);

  const handleClose = () => {
    if (submissionInFlight.current) return;
    onClose();
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const nameLength = getValidationLength(trimmedName);

    if (nameLength < 2) {
      errors.name = 'Name must be at least 2 characters.';
    } else if (nameLength > 100) {
      errors.name = 'Name must not exceed 100 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedEmail) {
      errors.email = 'Email is required.';
    } else if (
      normalizedEmail.length > 254 ||
      !emailRegex.test(normalizedEmail)
    ) {
      errors.email = 'Please enter a valid email address.';
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!user || submissionInFlight.current) return;

    setServerError('');
    setInfoMessage('');

    if (!canManageUsers(operator)) {
      setServerError('Active administrator access is required to edit users.');
      return;
    }

    if (role !== user.role && !canChangeUserRole(operator, user)) {
      setServerError('You cannot change your own role. You can still edit your name and email.');
      return;
    }

    if (!validate()) return;

    // Only submit changed fields
    const payload: UpdateUserRequest = {};

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName !== (user.name ?? '')) {
      payload.name = normalizedName;
    }

    if (normalizedEmail !== user.email) {
      payload.email = normalizedEmail;
    }

    if (role !== user.role) {
      payload.role = role;
    }

    // Prevent empty PATCH requests
    if (Object.keys(payload).length === 0) {
      setInfoMessage('No changes detected.');
      return;
    }

    submissionInFlight.current = true;
    setSubmitting(true);

    try {
      await updateUser(user.id, payload);

      onUpdated();
      onClose();

    } catch (error: unknown) {
      setServerError(
        error instanceof Error
          ? error.message
          : 'Failed to update user.',
      );
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        onAccessDenied?.();
      }
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        Edit User
      </DialogTitle>

      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
      >
        <DialogContent dividers>
          <Stack spacing={2.5}>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Update user information and access permissions.
            </Typography>

            {serverError && (
              <Alert severity="error">
                {serverError}
              </Alert>
            )}

            {infoMessage && (
              <Alert severity="info">
                {infoMessage}
              </Alert>
            )}

            {/* Name */}
            <TextField
              fullWidth
              required
              disabled={submitting || !canEdit}
              label="Full Name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setInfoMessage('');

                setFieldErrors((previous) => ({
                  ...previous,
                  name: undefined,
                }));
              }}
              error={Boolean(fieldErrors.name)}
              helperText={fieldErrors.name}
            />

            {/* Email */}
            <TextField
              fullWidth
              required
              disabled={submitting || !canEdit}
              type="email"
              label="Email Address"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setInfoMessage('');

                setFieldErrors((previous) => ({
                  ...previous,
                  email: undefined,
                }));
              }}
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email}
              slotProps={{
                htmlInput: {
                  maxLength: 254,
                },
              }}
            />

            {/* Role */}
            <FormControl fullWidth disabled={submitting || !canChangeRole}>
              <InputLabel id="edit-user-role-label">
                Role
              </InputLabel>

              <Select
                labelId="edit-user-role-label"
                value={role}
                label="Role"
                onChange={(event) => {
                  setRole(event.target.value as UserRole);
                  setInfoMessage('');
                }}
              >
                <MenuItem value="MEMBER">
                  MEMBER
                </MenuItem>

                <MenuItem value="ADMIN">
                  ADMIN
                </MenuItem>
              </Select>

              <FormHelperText>
                {USER_ROLE_DESCRIPTIONS[role]}
                {editingSelf && ' Your own role is locked; you can still edit your name and email.'}
                {!canEdit && ' Active administrator access is required to edit users.'}
              </FormHelperText>
            </FormControl>

            <Alert severity="info">
              Account access is controlled by the status actions in the user list.
              Changing a role does not activate a pending, suspended or rejected account.
            </Alert>

          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button
            color="inherit"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !canEdit}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
