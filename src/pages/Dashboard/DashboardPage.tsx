<<<<<<< Updated upstream
import { Container, Stack, Typography } from '@mui/material';
=======
import { Container, Typography } from '@mui/material';
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
        <Stack spacing={3} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Hello, {user?.name ?? 'user'}. This is a placeholder page. The full
            dashboard will be built in a later phase.
          </Typography>
        </Stack>
=======
        <Typography variant="h4" component="h1">
          Olá, {user?.name ?? 'usuário'}
        </Typography>
>>>>>>> Stashed changes
      </Container>
    </DashboardLayout>
  );
}
