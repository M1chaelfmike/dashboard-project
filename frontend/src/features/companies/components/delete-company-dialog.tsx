
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
} from '@mui/material';

import type { Company } from '@/lib/api/companies';

interface DeleteCompanyDialogProps {
  open: boolean;
  company: Company | null;
  loading: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteCompanyDialog({
  open,
  company,
  loading,
  error,
  onClose,
  onConfirm,
}: DeleteCompanyDialogProps) {
  if (!company) return null;

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!loading) {
          onClose();
        }
      }}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        Delete Company
      </DialogTitle>

      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this company?
          This action cannot be undone.
        </DialogContentText>

        <Stack spacing={0.5} sx={{ mt: 2 }}>
          <Typography sx={{ fontWeight: 600 }}>
            {company.companyName}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Company Code: {company.companyCode}
          </Typography>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button
          color="inherit"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
