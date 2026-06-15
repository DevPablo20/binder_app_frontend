import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';

import { BinderLogo } from '@/components/BinderLogo';
import { ThemeModeToggle } from '@/theme/ThemeModeToggle';

export function PasswordResetPage() {
  const { token } = useParams<{ token: string }>();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
        <ThemeModeToggle />
      </Box>
      <Container
        maxWidth="sm"
        sx={{ py: { xs: 4, sm: 6 }, px: { xs: 2, sm: 4 } }}
      >
        <Stack spacing={3} sx={{ alignItems: 'flex-start' }}>
          <BinderLogo
            sx={{ width: { xs: 'min(220px, 70vw)', sm: 280 }, height: 'auto' }}
          />
          <Typography variant="h4" component="h1">
            Set New Password
          </Typography>
          <Typography variant="body1" color="text.secondary">
            The password reset form will be available in the next phase.
          </Typography>
          {token ? (
            <Typography variant="caption" color="text.secondary">
              Reset token received.
            </Typography>
          ) : null}
          <Button component={RouterLink} to="/" variant="text" color="primary">
            Back to home
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
