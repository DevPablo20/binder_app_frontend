import { Box, Container, Stack, Typography } from '@mui/material';

import { useAuth } from '@/auth/useAuth';
import { BinderLogo } from '@/components/BinderLogo';
import { ThemeModeToggle } from '@/theme/ThemeModeToggle';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
        <ThemeModeToggle />
      </Box>
      <Container
        maxWidth="md"
        sx={{ py: { xs: 4, sm: 6 }, px: { xs: 2, sm: 4 } }}
      >
        <Stack spacing={3} sx={{ alignItems: 'flex-start' }}>
          <BinderLogo
            sx={{ width: { xs: 'min(180px, 60vw)', sm: 220 }, height: 'auto' }}
          />
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Hello, {user?.name ?? 'user'}. This is a placeholder page. The full
            dashboard will be built in a later phase.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Logout will be available in a later phase.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
