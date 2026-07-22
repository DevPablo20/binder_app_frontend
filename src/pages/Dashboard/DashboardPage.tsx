import { Container, Typography } from '@mui/material';

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
        <Typography variant="h4" component="h1">
          Olá, {user?.name ?? 'usuário'}
        </Typography>
      </Container>
    </DashboardLayout>
  );
}
