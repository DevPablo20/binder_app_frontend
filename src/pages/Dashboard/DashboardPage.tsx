import { Container, Stack, Typography } from '@mui/material';

import { useAuth } from '@/auth/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <Container
        maxWidth="md"
        sx={{ py: { xs: 4, sm: 6 }, px: { xs: 2, sm: 4 } }}
      >
        <Stack spacing={3} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Hello, {user?.name ?? 'user'}. This is a placeholder page. The full
            dashboard will be built in a later phase.
          </Typography>
        </Stack>
      </Container>
    </DashboardLayout>
  );
}
