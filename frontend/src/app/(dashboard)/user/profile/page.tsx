
'use client';

import { useRef, useState, type FormEvent } from 'react';

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import { useAuth } from '@/features/auth/use-auth';
import { updateMyProfile } from '@/lib/api/auth';
import { getValidationLength } from '@/lib/validation/string-length';

export default function UserProfilePage() {
  const { user, logout, updateUser } = useAuth();

  // Profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const saveInFlight = useRef(false);

  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const handleStartEditing = () => {
    if (!user) return;

    setName(user.name ?? '');
    setEmail(user.email);

    setProfileError('');
    setProfileSuccess('');
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    if (!user) return;

    setName(user.name ?? '');
    setEmail(user.email);

    setProfileError('');
    setIsEditing(false);
  };

  const handleSaveProfile = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!user || saveInFlight.current) return;

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      setProfileError('Name and email are required.');
      return;
    }

    if (getValidationLength(normalizedName) > 100) {
      setProfileError('Name must not exceed 100 characters.');
      return;
    }

    saveInFlight.current = true;
    setIsSaving(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const result = await updateMyProfile({
        name: normalizedName,
        email: normalizedEmail,
      });

      // Synchronize global authentication state
      updateUser(result.user);

      setName(result.user.name ?? '');
      setEmail(result.user.email);

      setIsEditing(false);
      setProfileSuccess(
        result.message || 'Profile updated successfully.',
      );
    } catch (error: unknown) {
      setProfileError(
        error instanceof Error
          ? error.message
          : 'Unable to update profile. Please try again.',
      );
    } finally {
      saveInFlight.current = false;
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError('');

    try {
      await logout();
    } catch (error: unknown) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : 'Logout failed. Please try again.',
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  const hasChanges =
    name.trim() !== (user.name ?? '') ||
    email.trim().toLowerCase() !== user.email;

  const statusColor =
    user.status === 'ACTIVE'
      ? 'success'
      : user.status === 'PENDING_APPROVAL'
        ? 'warning'
        : user.status === 'SUSPENDED'
          ? 'default'
          : 'error';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>

        {/* Header */}
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            My Profile
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            View and manage your personal account information.
          </Typography>
        </Box>

        {/* Feedback */}
        {profileError && (
          <Alert severity="error">
            {profileError}
          </Alert>
        )}

        {profileSuccess && (
          <Alert severity="success">
            {profileSuccess}
          </Alert>
        )}

        {logoutError && (
          <Alert severity="error">
            {logoutError}
          </Alert>
        )}

        {/* Personal Information */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={2}>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Personal Information
              </Typography>

              {!isEditing && (
                <Button
                  variant="outlined"
                  onClick={handleStartEditing}
                >
                  Edit Profile
                </Button>
              )}
            </Box>

            <Box
              component="form"
              onSubmit={handleSaveProfile}
            >
              <TableContainer>
                <Table aria-label="Personal information">
                  <TableBody>

                    {/* Name */}
                    <TableRow>
                      <TableCell
                        sx={{
                          width: { xs: '35%', sm: 220 },
                          fontWeight: 600,
                          color: 'text.secondary',
                        }}
                      >
                        Full Name
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={name}
                            onChange={(event) =>
                              setName(event.target.value)
                            }
                            placeholder="Enter your full name"
                            required
                            disabled={isSaving}
                          />
                        ) : (
                          <Typography>
                            {user.name || 'Not provided'}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Email */}
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: 'text.secondary',
                        }}
                      >
                        Email Address
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <TextField
                            fullWidth
                            size="small"
                            type="email"
                            value={email}
                            onChange={(event) =>
                              setEmail(event.target.value)
                            }
                            placeholder="Enter your email address"
                            required
                            disabled={isSaving}
                            slotProps={{
                              htmlInput: {
                                maxLength: 254,
                              },
                            }}
                          />
                        ) : (
                          <Typography
                            sx={{ overflowWrap: 'anywhere' }}
                          >
                            {user.email}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* User ID */}
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: 'text.secondary',
                        }}
                      >
                        User ID
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ overflowWrap: 'anywhere' }}
                        >
                          {user.id}
                        </Typography>
                      </TableCell>
                    </TableRow>

                    {/* Role */}
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: 'text.secondary',
                        }}
                      >
                        Role
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={user.role}
                          size="small"
                          color={
                            user.role === 'ADMIN'
                              ? 'primary'
                              : 'default'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>

                    {/* Status */}
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: 'text.secondary',
                        }}
                      >
                        Status
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={user.status}
                          size="small"
                          color={statusColor}
                        />
                      </TableCell>
                    </TableRow>

                    {/* Account Created */}
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: 'text.secondary',
                        }}
                      >
                        Account Created
                      </TableCell>

                      <TableCell>
                        {new Date(user.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>

                    {/* Last Updated */}
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: 'text.secondary',
                        }}
                      >
                        Last Updated
                      </TableCell>

                      <TableCell>
                        {new Date(user.updatedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>

                  </TableBody>
                </Table>
              </TableContainer>

              {/* Edit Actions */}
              {isEditing && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1.5,
                    mt: 2.5,
                  }}
                >
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={handleCancelEditing}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSaving || !hasChanges}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              )}

            </Box>
          </Stack>
        </Paper>

        {/* Account Actions */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 600 }}>
                Account Actions
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Sign out of your current account.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Signing Out...' : 'Logout'}
            </Button>
          </Box>
        </Paper>

      </Stack>
    </Container>
  );
}
