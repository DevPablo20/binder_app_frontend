import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';
import { BinderLogo } from '@/components/BinderLogo';
import { ThemeModeToggle } from '@/theme/ThemeModeToggle';

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading } = useAuth();
  const [showPasswordResetSuccess, setShowPasswordResetSuccess] = useState(() =>
    Boolean(location.state?.passwordResetSuccess),
  );
  const [showInviteRefusedSuccess, setShowInviteRefusedSuccess] = useState(() =>
    Boolean(location.state?.inviteRefusedSuccess),
  );

  useEffect(() => {
    if (
      location.state?.passwordResetSuccess ||
      location.state?.inviteRefusedSuccess
    ) {
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.gradient',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          p: 2,
        }}
      >
        <ThemeModeToggle />
      </Box>

      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { xs: 2, sm: 4 },
          pb: { xs: 6, sm: 8 },
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Stack spacing={4} sx={{ alignItems: 'flex-start' }}>
            {showPasswordResetSuccess && (
              <Alert
                severity="success"
                sx={{ width: '100%' }}
                onClose={() => setShowPasswordResetSuccess(false)}
              >
                Senha redefinida. Faça login com sua nova senha.
              </Alert>
            )}
            {showInviteRefusedSuccess && (
              <Alert
                severity="info"
                sx={{ width: '100%' }}
                onClose={() => setShowInviteRefusedSuccess(false)}
              >
                Convite recusado com sucesso.
              </Alert>
            )}

            <BinderLogo
              sx={{
                width: { xs: 'min(280px, 85vw)', sm: 340, md: 420 },
                height: 'auto',
                display: 'block',
              }}
            />

            <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
              <Typography variant="h4" component="h1">
                Bem vindo ao Aplicativo Binder
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => navigate('/login')}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Login
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => navigate('/password/forgot')}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Recuperar Senha
              </Button>
            </Stack>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
