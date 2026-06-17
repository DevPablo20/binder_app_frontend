import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { acceptInvite, getInviteDetails } from '@/api/invite';
import { ApiError } from '@/api/client';
import { ROLE_LABELS } from '@/auth/roles';
import { BinderLogo } from '@/components/BinderLogo';
import { ThemeModeToggle } from '@/theme/ThemeModeToggle';

const PASSWORD_REGEX = /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;

const acceptInviteSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: 'O Nome é obrigatório' })
      .max(255, { message: 'O Nome deve ter no máximo 255 caracteres' }),
    password: z
      .string()
      .min(8, {
        message: 'A Senha informada deve conter no mínimo 8 caracteres',
      })
      .max(32, {
        message: 'A Senha informada deve conter na máximo 32 caracteres',
      })
      .regex(PASSWORD_REGEX, {
        message:
          'Senha fraca: sua senha deve conter números, letras maiúsculas, letras minúsculas e caracteres especiais',
      }),
    confirmPassword: z.string().min(1, { message: 'Confirme sua senha' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>;

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

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    data: invite,
    isLoading,
    error: detailsError,
  } = useQuery({
    queryKey: ['invite', 'details', token],
    queryFn: () => getInviteDetails(token!),
    enabled: Boolean(token),
    retry: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      name: '',
      password: '',
      confirmPassword: '',
    },
  });

  const mutation = useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => {
      navigate('/login', {
        replace: true,
        state: { inviteAcceptedSuccess: true },
      });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError('Erro ao aceitar convite. Tente novamente.');
      }
    },
  });

  const onSubmit = (values: AcceptInviteFormValues) => {
    if (!token) return;
    setApiError(null);
    mutation.mutate({
      token,
      name: values.name,
      password: values.password,
    });
  };

  if (!token) {
    return (
      <PublicPageShell>
        <Typography variant="h4" component="h1">
          Aceitar convite
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
          Aceitar convite
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
          Aceitar convite
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
        Aceitar convite
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Você foi convidado(a) por {invite?.inviterName} para participar da
        Plataforma Binder.
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

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ width: '100%' }}
      >
        <Stack spacing={2}>
          <TextField
            label="Nome"
            autoComplete="name"
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register('name')}
          />
          <TextField
            label="Senha"
            type="password"
            autoComplete="new-password"
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password')}
          />
          <TextField
            label="Confirmar senha"
            type="password"
            autoComplete="new-password"
            fullWidth
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={mutation.isPending}
            startIcon={
              mutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : undefined
            }
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Criar conta
          </Button>
        </Stack>
      </Box>

      <Link
        component={RouterLink}
        to={`/invite/refuse/${token}`}
        variant="body2"
      >
        Recusar convite
      </Link>

      <Button component={RouterLink} to="/" variant="text" color="primary">
        Voltar ao início
      </Button>
    </PublicPageShell>
  );
}
