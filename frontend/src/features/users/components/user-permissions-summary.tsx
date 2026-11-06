'use client';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import { USER_ROLE_DESCRIPTIONS } from '../permissions';

export default function UserPermissionsSummary() {
  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '16px !important',
        '&::before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        id="user-permissions-header"
        aria-controls="user-permissions-content"
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <AdminPanelSettingsOutlinedIcon color="primary" />
          <Box>
            <Typography sx={{ fontWeight: 600 }}>Roles and account access</Typography>
            <Typography variant="body2" color="text.secondary">
              Role controls permissions. Status controls whether a user can sign in.
            </Typography>
          </Box>
        </Stack>
      </AccordionSummary>
      <AccordionDetails id="user-permissions-content">
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {(['ADMIN', 'MEMBER'] as const).map(role => (
              <Box
                key={role}
                sx={{ flex: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
              >
                <Chip
                  label={role}
                  color={role === 'ADMIN' ? 'primary' : 'default'}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2">{USER_ROLE_DESCRIPTIONS[role]}</Typography>
              </Box>
            ))}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Only ACTIVE accounts can sign in. Pending registrations require approval;
            suspended accounts need reactivation. Rejected registrations have no access.
          </Typography>
          <Alert severity="info">
            You can edit your own name and email. Changing your own role,
            suspending yourself and deleting your own account are disabled.
          </Alert>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
