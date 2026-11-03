import { Stack, Typography, Paper } from '@mui/material';

export default function UserPage() {
    return (
        <Stack spacing={3}>
            <Typography variant="h4" fontWeight={700}>
                User
            </Typography>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                <Typography color="text.secondary">
                    User management will be implemented here.
                </Typography>
            </Paper>
        </Stack>
    );
}