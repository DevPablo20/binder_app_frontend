import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { getCompanies } from '@/api/company';
import { createInvite } from '@/api/invite';
import { ApiError } from '@/api/client';
import { ROLE_LABELS } from '@/auth/roles';
import { useAuth } from '@/auth/useAuth';
import type { Role } from '@/types/user';

const INVITE_ROLES = ['editor', 'viewer'] as const satisfies readonly Role[];

const createInviteSchema = z.object({
  email: z.email({ message: 'O e-mail deve ser válido' }),
  companyIds: z
    .array(z.string())
    .min(1, { message: 'Selecione ao menos uma empresa' }),
  role: z.enum(INVITE_ROLES, { message: 'Selecione um perfil' }),
});

type CreateInviteFormValues = z.infer<typeof createInviteSchema>;

interface CreateInviteDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateInviteDialog({
  open,
  onClose,
  onSuccess,
}: CreateInviteDialogProps) {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] =
    useState<CreateInviteFormValues | null>(null);

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
    enabled: open && isSuperadmin,
  });

  const companies = useMemo(() => {
    if (isSuperadmin) {
      return allCompanies
        .filter((company) => company.isActive)
        .map((company) => ({ id: company.id, name: company.name }));
    }

    return (user?.companies ?? [])
      .filter((company) => company.isActive)
      .map((company) => ({ id: company.id, name: company.name }));
  }, [allCompanies, isSuperadmin, user?.companies]);

  const companyNameById = useMemo(
    () => new Map(companies.map((company) => [company.id, company.name])),
    [companies],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInviteFormValues>({
    resolver: zodResolver(createInviteSchema),
    defaultValues: {
      email: '',
      companyIds: [],
      role: 'editor',
    },
  });

  const mutation = useMutation({
    mutationFn: createInvite,
    onSuccess: () => {
      reset();
      setPendingValues(null);
      setConfirmOpen(false);
      onSuccess();
      onClose();
    },
  });

  const handleClose = () => {
    if (mutation.isPending) return;
    reset();
    mutation.reset();
    setPendingValues(null);
    setConfirmOpen(false);
    onClose();
  };

  const handleCancelConfirm = () => {
    if (mutation.isPending) return;
    setConfirmOpen(false);
    setPendingValues(null);
    mutation.reset();
  };

  const onSubmit = (values: CreateInviteFormValues) => {
    mutation.reset();
    setPendingValues(values);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!pendingValues) return;
    mutation.mutate({
      email: pendingValues.email,
      companyIds: pendingValues.companyIds,
      role: pendingValues.role,
    });
  };

  const apiError =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? 'Erro ao criar convite. Tente novamente.'
        : null;

  const selectedCompanyNames =
    pendingValues?.companyIds
      .map((id) => companyNameById.get(id))
      .filter((name): name is string => Boolean(name)) ?? [];

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Novo convite</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="E-mail"
                type="email"
                fullWidth
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />

              <Controller
                name="companyIds"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.companyIds}>
                    <InputLabel id="invite-companies-label">
                      Empresas
                    </InputLabel>
                    <Select
                      {...field}
                      multiple
                      labelId="invite-companies-label"
                      label="Empresas"
                      renderValue={(selected) =>
                        selected
                          .map((id) => companyNameById.get(id))
                          .filter(Boolean)
                          .join(', ')
                      }
                    >
                      {companies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          <Checkbox
                            checked={field.value.includes(company.id)}
                          />
                          <ListItemText primary={company.name} />
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.companyIds && (
                      <FormHelperText>
                        {errors.companyIds.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.role}>
                    <InputLabel id="invite-role-label">Perfil</InputLabel>
                    <Select
                      {...field}
                      labelId="invite-role-label"
                      label="Perfil"
                    >
                      <MenuItem value="editor">Editor</MenuItem>
                      <MenuItem value="viewer">Visualizador</MenuItem>
                    </Select>
                    {errors.role && (
                      <FormHelperText>{errors.role.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={mutation.isPending || companies.length === 0}
            >
              Continuar
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={handleCancelConfirm}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar convite</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {apiError && <Alert severity="error">{apiError}</Alert>}
            <Typography variant="body2" color="text.secondary">
              Revise os dados antes de enviar o convite:
            </Typography>
            <Box>
              <Typography variant="subtitle2">E-mail</Typography>
              <Typography variant="body1">{pendingValues?.email}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">Empresas</Typography>
              <Typography variant="body1">
                {selectedCompanyNames.length > 0
                  ? selectedCompanyNames.join(', ')
                  : '—'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">Perfil</Typography>
              <Typography variant="body1">
                {pendingValues ? ROLE_LABELS[pendingValues.role] : '—'}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelConfirm} disabled={mutation.isPending}>
            Voltar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={mutation.isPending}
            startIcon={
              mutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : undefined
            }
          >
            Enviar convite
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
