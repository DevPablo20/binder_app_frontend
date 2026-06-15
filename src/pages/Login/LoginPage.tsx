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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { login } from '@/api/auth';
import { ApiError } from '@/api/client';
import { BinderLogo } from '@/components/BinderLogo';
import { ThemeModeToggle } from '@/theme/ThemeModeToggle';

const loginSchema = z.object({
  email: z.email({ message: 'O Email deve ser válido' }),
  password: z.string().min(1, { message: 'A Senha é obrigatória' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      navigate('/dashboard', { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError('Erro ao fazer login. Tente novamente.');
      }
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    setApiError(null);
    mutation.mutate(values);
  };

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
            Login
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
                label="Email"
                type="email"
                autoComplete="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email')}
              />
              <TextField
                label="Senha"
                type="password"
                autoComplete="current-password"
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register('password')}
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
                Entrar
              </Button>
            </Stack>
          </Box>

          <Link component={RouterLink} to="/password/forgot" variant="body2">
            Esqueci minha senha
          </Link>
          <Button component={RouterLink} to="/" variant="text" color="primary">
            Voltar ao início
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
