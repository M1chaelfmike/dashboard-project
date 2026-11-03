import { Stack, Typography, Paper } from '@mui/material';

export default function OrderPage() {
    return (
        <Stack spacing={3}>
            <Typography variant="h4" fontWeight={700}>
                Order
            </Typography>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                <Typography color="text.secondary">
                    Order management will be implemented here.
                </Typography>
            </Paper>
        </Stack>
    );
}