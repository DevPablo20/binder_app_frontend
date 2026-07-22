import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { createClient, getClients, updateClients } from '@/api/client-api';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ClientCampaignsDrawer } from '@/pages/Clients/ClientCampaignsDrawer';
import type { ClientSummary } from '@/types/client';
import { getErrorMessage, truncate } from '@/utils/errors';

const clientSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'O nome é obrigatório' })
    .max(255, { message: 'O nome deve ter no máximo 255 caracteres' }),
  description: z.string().min(1, { message: 'A descrição é obrigatória' }),
  companyId: z.string().min(1, { message: 'Selecione uma empresa' }),
  isActive: z.boolean(),
});

const editClientSchema = clientSchema.omit({ companyId: true });

type ClientFormValues = z.infer<typeof clientSchema>;
type EditClientFormValues = z.infer<typeof editClientSchema>;
type DialogMode = 'create' | 'edit' | null;

export function ClientsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const companies = user?.companies ?? [];
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingClient, setEditingClient] = useState<ClientSummary | null>(
    null,
  );
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    null,
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState<'create' | 'edit' | null>(
    null,
  );
  const [pendingValues, setPendingValues] = useState<
    ClientFormValues | EditClientFormValues | null
  >(null);

  const {
    data: clients = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  const companyNameById = useMemo(
    () => new Map(companies.map((company) => [company.id, company.name])),
    [companies],
  );

  const selectedClient =
    clients.find((client) => client.id === selectedClientId) ?? null;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      description: '',
      companyId: companies[0]?.id ?? '',
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      handleCloseAllDialogs();
    },
    onError: (err) =>
      setApiError(getErrorMessage(err, 'Erro ao criar cliente.')),
  });

  const updateMutation = useMutation({
    mutationFn: updateClients,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      handleCloseAllDialogs();
    },
    onError: (err) =>
      setApiError(getErrorMessage(err, 'Erro ao salvar cliente.')),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleOpenCreate = () => {
    setApiError(null);
    setEditingClient(null);
    reset({
      name: '',
      description: '',
      companyId: companies[0]?.id ?? '',
      isActive: true,
    });
    setDialogMode('create');
  };

  const handleOpenEdit = (client: ClientSummary) => {
    setApiError(null);
    setEditingClient(client);
    reset({
      name: client.name,
      description: '',
      companyId: client.companyId,
      isActive: client.isActive,
    });
    void queryClient
      .fetchQuery({
        queryKey: ['clients', client.id],
        queryFn: async () => {
          const { getClient } = await import('@/api/client-api');
          return getClient(client.id);
        },
      })
      .then((detail) => {
        reset({
          name: detail.name,
          description: detail.description,
          companyId: detail.companyId,
          isActive: detail.isActive,
        });
      });
    setDialogMode('edit');
  };

  const handleCloseAllDialogs = () => {
    setDialogMode(null);
    setEditingClient(null);
    setApiError(null);
    setConfirmMode(null);
    setPendingValues(null);
    reset({
      name: '',
      description: '',
      companyId: companies[0]?.id ?? '',
      isActive: true,
    });
  };

  const handleCloseDialog = () => {
    if (isSaving) return;
    handleCloseAllDialogs();
  };

  const onSubmit = (values: ClientFormValues) => {
    setApiError(null);
    setPendingValues(values);
    setConfirmMode(dialogMode === 'create' ? 'create' : 'edit');
  };

  const handleConfirm = () => {
    if (!pendingValues) return;

    if (confirmMode === 'create') {
      const values = pendingValues as ClientFormValues;
      if (!values.companyId) {
        setApiError('Selecione uma empresa.');
        return;
      }
      createMutation.mutate({
        name: values.name,
        description: values.description,
        companyId: values.companyId,
        isActive: values.isActive,
      });
      return;
    }

    if (confirmMode === 'edit' && editingClient) {
      const values = pendingValues as EditClientFormValues;
      updateMutation.mutate({
        clients: [{ id: editingClient.id, ...values }],
      });
    }
  };

  const listError =
    error instanceof ApiError
      ? error.message
      : error
        ? 'Erro ao carregar clientes.'
        : null;

  return (
    <DashboardLayout>
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 4, sm: 6 }, px: { xs: 2, sm: 4 } }}
      >
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{
                alignItems: { sm: 'center' },
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h4" component="h1">
                Negócio
              </Typography>
              <Button
                variant="contained"
                onClick={handleOpenCreate}
                disabled={companies.length === 0}
              >
                Novo cliente
              </Button>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Clientes, campanhas e agrupamentos estratégicos
            </Typography>
          </Stack>

          {listError && <Alert severity="error">{listError}</Alert>}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Empresa</TableCell>
                    <TableCell>Ativo</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ py: 2 }}
                        >
                          Nenhum cliente encontrado.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow key={client.id} hover>
                        <TableCell>{client.name}</TableCell>
                        <TableCell>
                          {companyNameById.get(client.companyId) ??
                            client.companyId}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={client.isActive ? 'Sim' : 'Não'}
                            size="small"
                            color={client.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ justifyContent: 'flex-end' }}
                          >
                            <Button
                              size="small"
                              onClick={() => setSelectedClientId(client.id)}
                            >
                              Campanhas
                            </Button>
                            <Button
                              size="small"
                              onClick={() => handleOpenEdit(client)}
                            >
                              Editar
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </Container>

      <ClientCampaignsDrawer
        client={selectedClient}
        open={selectedClientId !== null}
        onClose={() => setSelectedClientId(null)}
      />

      <Dialog
        open={dialogMode !== null}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Novo cliente' : 'Editar cliente'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {apiError && <Alert severity="error">{apiError}</Alert>}
              {dialogMode === 'create' && (
                <Controller
                  name="companyId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth required error={!!errors.companyId}>
                      <InputLabel id="client-company-label">Empresa</InputLabel>
                      <Select
                        {...field}
                        labelId="client-company-label"
                        label="Empresa"
                      >
                        {companies.map((company) => (
                          <MenuItem key={company.id} value={company.id}>
                            {company.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              )}
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nome"
                    fullWidth
                    required
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Descrição"
                    fullWidth
                    required
                    multiline
                    minRows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                      />
                    }
                    label="Ativo"
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              Continuar
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={confirmMode !== null}
        onClose={() => setConfirmMode(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {confirmMode === 'create' ? 'Confirmar criação' : 'Confirmar edição'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {apiError && <Alert severity="error">{apiError}</Alert>}
            <Typography variant="body2" color="text.secondary">
              {truncate(pendingValues?.description ?? '', 120)}
            </Typography>
            <Typography variant="body1">{pendingValues?.name}</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmMode(null)} disabled={isSaving}>
            Voltar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={isSaving}
          >
            {isSaving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Confirmar'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
