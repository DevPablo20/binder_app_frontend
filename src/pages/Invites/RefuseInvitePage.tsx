import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';

import { getInviteDetails, refuseInvite } from '@/api/invite';
import { ApiError } from '@/api/client';
import { ROLE_LABELS } from '@/auth/roles';
import { BinderLogo } from '@/components/BinderLogo';
import { ThemeModeToggle } from '@/theme/ThemeModeToggle';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function PublicPageShell({ children }: { children: ReactNode }) {
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
          {children}
        </Stack>
      </Container>
    </Box>
  );
}

export function RefuseInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [refused, setRefused] = useState(false);

  const {
    data: invite,
    isLoading,
    error: detailsError,
  } = useQuery({
    queryKey: ['invite', 'details', token],
    queryFn: () => getInviteDetails(token!),
    enabled: Boolean(token) && !refused,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: refuseInvite,
    onSuccess: () => {
      setRefused(true);
      navigate('/', {
        replace: true,
        state: { inviteRefusedSuccess: true },
      });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError('Erro ao recusar convite. Tente novamente.');
      }
    },
  });

  const handleRefuse = () => {
    if (!token) return;
    setApiError(null);
    mutation.mutate({ token });
  };

  if (!token) {
    return (
      <PublicPageShell>
        <Typography variant="h4" component="h1">
          Recusar convite
        </Typography>
        <Alert severity="error" sx={{ width: '100%' }}>
          Link de convite inválido.
        </Alert>
        <Button component={RouterLink} to="/" variant="text" color="primary">
          Voltar ao início
        </Button>
      </PublicPageShell>
    );
  }

  if (isLoading) {
    return (
      <PublicPageShell>
        <Typography variant="h4" component="h1">
          Recusar convite
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 4,
            width: '100%',
          }}
        >
          <CircularProgress />
        </Box>
      </PublicPageShell>
    );
  }

  if (detailsError) {
    const message =
      detailsError instanceof ApiError
        ? detailsError.message
        : 'Não foi possível carregar o convite.';

    return (
      <PublicPageShell>
        <Typography variant="h4" component="h1">
          Recusar convite
        </Typography>
        <Alert severity="error" sx={{ width: '100%' }}>
          {message}
        </Alert>
        <Button component={RouterLink} to="/" variant="text" color="primary">
          Voltar ao início
        </Button>
      </PublicPageShell>
    );
  }

  const companyNames = invite?.companies.map((c) => c.name).join(', ') ?? '—';

  return (
    <PublicPageShell>
      <Typography variant="h4" component="h1">
        Recusar convite
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Tem certeza de que deseja recusar o convite de {invite?.inviterName}?
      </Typography>

      <Stack spacing={1} sx={{ width: '100%' }}>
        <Typography variant="subtitle2">E-mail</Typography>
        <Typography variant="body1">{invite?.email}</Typography>
        <Typography variant="subtitle2">Perfil</Typography>
        <Typography variant="body1">
          {invite ? ROLE_LABELS[invite.role] : '—'}
        </Typography>
        <Typography variant="subtitle2">Empresas</Typography>
        <Typography variant="body1">{companyNames}</Typography>
        <Typography variant="subtitle2">Expira em</Typography>
        <Typography variant="body1">
          {invite ? formatDate(invite.expiresAt) : '—'}
        </Typography>
      </Stack>

      {apiError && (
        <Alert severity="error" sx={{ width: '100%' }}>
          {apiError}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button
          variant="contained"
          color="error"
          size="large"
          disabled={mutation.isPending}
          onClick={handleRefuse}
          startIcon={
            mutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : undefined
          }
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Recusar convite
        </Button>
        <Button
          component={RouterLink}
          to={`/invite/accept/${token}`}
          variant="outlined"
          size="large"
          disabled={mutation.isPending}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Aceitar convite
        </Button>
      </Stack>

      <Button component={RouterLink} to="/" variant="text" color="primary">
        Voltar ao início
      </Button>
    </PublicPageShell>
  );
}
