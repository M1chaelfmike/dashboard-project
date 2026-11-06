'use client';

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
  Chip,
} from '@mui/material';
import type { ButtonProps } from '@mui/material';
import type { AuthUser } from '@/lib/api/auth';
import {
  USER_STATUS_ACTION_LABELS,
  type UserStatusAction,
} from '../permissions';

interface UserStatusDialogProps {
  user: AuthUser | null;
  action: UserStatusAction | null;
  open: boolean;
  loading: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}

const ACTION_DETAILS: Record<UserStatusAction, {
  title: string;
  description: string;
  color: ButtonProps['color'];
}> = {
  approve: {
    title: 'Approve registration?',
    description: 'This account will become active. The user can sign in and use the permissions assigned to their role.',
    color: 'success',
  },
  reject: {
    title: 'Reject registration?',
    description: 'This registration will be rejected and the user will not be able to sign in. Rejected registrations cannot be approved from the user list.',
    color: 'error',
  },
  suspend: {
    title: 'Suspend account access?',
    description: 'The user will lose access immediately, including access through their current session. Their account is kept and can be reactivated later.',
    color: 'warning',
  },
  reactivate: {
    title: 'Reactivate account?',
    description: 'This account will become active again. The user can sign in using the permissions assigned to their existing role.',
    color: 'success',
  },
};

export default function UserStatusDialog({
  user,
  action,
  open,
  loading,
  error,
  onClose,
  onConfirm,
}: UserStatusDialogProps) {
  if (!user || !action) return null;

  const details = ACTION_DETAILS[action];
  const label = USER_STATUS_ACTION_LABELS[action];

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      aria-labelledby="user-status-dialog-title"
      aria-describedby="user-status-dialog-description"
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle id="user-status-dialog-title" sx={{ fontWeight: 700 }}>
        {details.title}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <div>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Typography sx={{ fontWeight: 600 }}>
                {user.name?.trim() || 'Unnamed User'}
              </Typography>

              <Chip
                label={user.role}
                size="small"
                color={user.role === 'ADMIN' ? 'primary' : 'default'}
                variant="outlined"
              />
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ overflowWrap: 'anywhere' }}
            >
              {user.email}
            </Typography>
          </div>
          <DialogContentText id="user-status-dialog-description">
            {details.description}
          </DialogContentText>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button color="inherit" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={details.color}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Updating...' : label}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
