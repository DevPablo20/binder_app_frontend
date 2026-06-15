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
import { Link as RouterLink } from 'react-router-dom';
import { z } from 'zod';

import { forgotPassword } from '@/api/auth';
import { ApiError } from '@/api/client';
import { BinderLogo } from '@/components/BinderLogo';
import { ThemeModeToggle } from '@/theme/ThemeModeToggle';

const forgotPasswordSchema = z.object({
  email: z.email({ message: 'O Email deve ser válido' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function PasswordForgotPage() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      setApiError(null);
      setSubmitted(true);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError('Erro ao solicitar recuperação de senha. Tente novamente.');
      }
    },
  });

  const onSubmit = (values: ForgotPasswordFormValues) => {
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
            Recuperar senha
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Informe seu email para receber um link de redefinição de senha.
          </Typography>

          {submitted && (
            <Alert severity="success" sx={{ width: '100%' }}>
              Email de recuperação enviado. Verifique sua caixa de entrada.
            </Alert>
          )}

          {apiError && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {apiError}
            </Alert>
          )}

          {!submitted && (
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
                  Enviar email
                </Button>
              </Stack>
            </Box>
          )}
          <Button component={RouterLink} to="/" variant="text" color="primary">
            Voltar ao início
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
