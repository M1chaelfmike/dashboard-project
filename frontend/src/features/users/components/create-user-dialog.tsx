
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

import { createUser } from '@/lib/api/users';
import { ApiError } from '@/lib/api/client';
import { getValidationLength } from '@/lib/validation/string-length';
import { useAuth } from '@/features/auth/use-auth';
import { canManageUsers, USER_ROLE_DESCRIPTIONS } from '../permissions';

import type { UserRole } from '@/lib/api/auth';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onAccessDenied?: () => void;
}

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function CreateUserDialog({
  open,
  onClose,
  onCreated,
  onAccessDenied,
}: CreateUserDialogProps) {
  const { user: operator } = useAuth();
  const canCreate = canManageUsers(operator);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [role, setRole] =
    useState<UserRole>('MEMBER');

  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors>({});

  const [serverError, setServerError] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);
  const submissionInFlight = useRef(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('MEMBER');
    setFieldErrors({});
    setServerError('');
  };

  const handleClose = () => {
    if (submissionInFlight.current) return;

    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const nameLength = getValidationLength(trimmedName);
    const passwordLength = getValidationLength(password);

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

    if (passwordLength < 8) {
      errors.password =
        'Password must be at least 8 characters.';
    } else if (passwordLength > 128) {
      errors.password =
        'Password must not exceed 128 characters.';
    }

    if (!confirmPassword) {
      errors.confirmPassword =
        'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword =
        'Passwords do not match.';
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (submissionInFlight.current) return;

    setServerError('');

    if (!canManageUsers(operator)) {
      setServerError('Active administrator access is required to create users.');
      return;
    }

    if (!validate()) return;

    submissionInFlight.current = true;
    setSubmitting(true);

    try {
      await createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      resetForm();
      onCreated();
      onClose();

    } catch (error: unknown) {
      setServerError(
        error instanceof Error
          ? error.message
          : 'Failed to create user.',
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
        Create New User
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
              Add a new user to the system.
            </Typography>

            {serverError && (
              <Alert severity="error">
                {serverError}
              </Alert>
            )}

            {/* Name */}
            <TextField
              fullWidth
              required
              label="Full Name"
              placeholder="Enter full name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
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
              type="email"
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
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

            {/* Password */}
            <TextField
              fullWidth
              required
              type="password"
              label="Password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setFieldErrors((previous) => ({
                  ...previous,
                  password: undefined,
                  confirmPassword: undefined,
                }));
              }}
              error={Boolean(fieldErrors.password)}
              helperText={
                fieldErrors.password ||
                'Password must contain 8–128 characters.'
              }
            />

            {/* Confirm Password */}
            <TextField
              fullWidth
              required
              type="password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setFieldErrors((previous) => ({
                  ...previous,
                  confirmPassword: undefined,
                }));
              }}
              error={Boolean(fieldErrors.confirmPassword)}
              helperText={fieldErrors.confirmPassword}
            />

            {/* Role */}
            <FormControl fullWidth disabled={submitting || !canCreate}>
              <InputLabel id="create-user-role-label">
                Role
              </InputLabel>

              <Select
                labelId="create-user-role-label"
                value={role}
                label="Role"
                onChange={(event) =>
                  setRole(event.target.value as UserRole)
                }
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
              </FormHelperText>
            </FormControl>

            <Alert severity="info">
              New users created by administrators are
              automatically assigned ACTIVE status.
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
            disabled={submitting || !canCreate}
          >
            {submitting ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
