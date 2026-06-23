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
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { resetPassword } from '@/api/auth';
import { ApiError } from '@/api/client';
import { BinderLogo } from '@/components/BinderLogo';
import { ThemeModeToggle } from '@/theme/ThemeModeToggle';

const PASSWORD_REGEX =
  /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'A Senha informada deve conter no mínimo 8 caracteres' })
      .max(32, { message: 'A Senha informada deve conter na máximo 32 caracteres' })
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

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function PasswordResetPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      navigate('/', {
        replace: true,
        state: { passwordResetSuccess: true },
      });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError('Erro ao redefinir senha. Tente novamente.');
      }
    },
  });

  const onSubmit = (values: ResetPasswordFormValues) => {
    if (!token) {
      return;
    }

    setApiError(null);
    mutation.mutate({ token, password: values.password });
  };

  if (!token) {
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
              sx={{
                width: { xs: 'min(220px, 70vw)', sm: 280 },
                height: 'auto',
              }}
            />
            <Typography variant="h4" component="h1">
              Redefinir senha
            </Typography>
            <Alert severity="error" sx={{ width: '100%' }}>
              Link de redefinição inválido.
            </Alert>
            <Link component={RouterLink} to="/password/forgot" variant="body2">
              Solicitar novo link de recuperação
            </Link>
            <Button
              component={RouterLink}
              to="/"
              variant="text"
              color="primary"
            >
              Voltar ao início
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

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
            Redefinir senha
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Escolha uma nova senha para sua conta.
          </Typography>

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
                label="Nova senha"
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
                Redefinir senha
              </Button>
            </Stack>
          </Box>

          {apiError && (
            <Link component={RouterLink} to="/password/forgot" variant="body2">
              Solicitar novo link de recuperação
            </Link>
          )}

          <Button component={RouterLink} to="/" variant="text" color="primary">
            Voltar ao início
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
