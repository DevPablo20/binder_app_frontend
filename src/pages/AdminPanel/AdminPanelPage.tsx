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
  FormControlLabel,
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
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { createCompany, getCompanies, updateCompanies } from '@/api/company';
import { ApiError } from '@/api/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CompanyUsersDrawer } from '@/pages/AdminPanel/CompanyUsersDrawer';
import type { CompanyWithUsers } from '@/types/company';

const companySchema = z.object({
  name: z
    .string()
    .min(1, { message: 'O nome é obrigatório' })
    .max(255, { message: 'O nome deve ter no máximo 255 caracteres' }),
  description: z.string().min(1, { message: 'A descrição é obrigatória' }),
  isActive: z.boolean(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

type DialogMode = 'create' | 'edit' | null;

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

export function AdminPanelPage() {
  const queryClient = useQueryClient();
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingCompany, setEditingCompany] = useState<CompanyWithUsers | null>(
    null,
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState<'create' | 'edit' | null>(null);
  const [pendingValues, setPendingValues] = useState<CompanyFormValues | null>(
    null,
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  );

  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies'] });
      handleCloseAllDialogs();
    },
    onError: (err) => {
      setApiError(getErrorMessage(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCompanies,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies'] });
      handleCloseAllDialogs();
    },
    onError: (err) => {
      setApiError(getErrorMessage(err));
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const selectedCompany =
    companies.find((company) => company.id === selectedCompanyId) ?? null;

  const handleOpenCompany = (company: CompanyWithUsers) => {
    setSelectedCompanyId(company.id);
  };

  const handleCloseCompanyPanel = () => {
    setSelectedCompanyId(null);
  };

  const handleOpenCreate = () => {
    setApiError(null);
    setEditingCompany(null);
    reset({ name: '', description: '', isActive: true });
    setDialogMode('create');
  };

  const handleOpenEdit = (company: CompanyWithUsers) => {
    setApiError(null);
    setEditingCompany(company);
    reset({
      name: company.name,
      description: company.description,
      isActive: company.isActive,
    });
    setDialogMode('edit');
  };

  const handleCloseAllDialogs = () => {
    setDialogMode(null);
    setEditingCompany(null);
    setApiError(null);
    setConfirmMode(null);
    setPendingValues(null);
    reset({ name: '', description: '', isActive: true });
  };

  const handleCloseDialog = () => {
    if (isSaving) return;
    handleCloseAllDialogs();
  };

  const onSubmit = (values: CompanyFormValues) => {
    setApiError(null);

    if (dialogMode === 'create') {
      setPendingValues(values);
      setConfirmMode('create');
      return;
    }

    if (dialogMode === 'edit' && editingCompany) {
      setPendingValues(values);
      setConfirmMode('edit');
    }
  };

  const handleConfirm = () => {
    if (!pendingValues) return;
    setApiError(null);

    if (confirmMode === 'create') {
      createMutation.mutate(pendingValues);
      return;
    }

    if (confirmMode === 'edit' && editingCompany) {
      updateMutation.mutate({
        companies: [
          {
            id: editingCompany.id,
            name: pendingValues.name,
            description: pendingValues.description,
            isActive: pendingValues.isActive,
          },
        ],
      });
    }
  };

  const handleCancelConfirm = () => {
    if (isSaving) return;
    setConfirmMode(null);
    setPendingValues(null);
    setApiError(null);
  };

  const listError =
    error instanceof ApiError
      ? error.message
      : error
        ? 'Erro ao carregar empresas.'
        : null;

  return (
    <DashboardLayout>
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 4, sm: 6 }, px: { xs: 2, sm: 4 } }}
      >
        <Stack spacing={3}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Typography variant="h4" component="h1">
              Empresas
            </Typography>
            <Button variant="contained" onClick={handleOpenCreate}>
              Nova empresa
            </Button>
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
                    <TableCell>Descrição</TableCell>
                    <TableCell>Ativa</TableCell>
                    <TableCell align="right">Usuários</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          Nenhuma empresa cadastrada.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((company) => (
                      <TableRow
                        key={company.id}
                        hover
                        selected={selectedCompanyId === company.id}
                        onClick={() => handleOpenCompany(company)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{company.name}</TableCell>
                        <TableCell>
                          {truncate(company.description, 80)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={company.isActive ? 'Sim' : 'Não'}
                            size="small"
                            color={company.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {company.users.length}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenEdit(company);
                            }}
                          >
                            Editar
                          </Button>
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

      <Dialog
        open={dialogMode !== null}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Nova empresa' : 'Editar empresa'}
        </DialogTitle>
        <Box
          component="form"
          key={dialogMode === 'edit' ? editingCompany?.id : 'create'}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {apiError && <Alert severity="error">{apiError}</Alert>}

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
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    }
                    label="Ativa"
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
              {isSaving ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                'Continuar'
              )}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={confirmMode !== null}
        onClose={handleCancelConfirm}
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
              {confirmMode === 'create'
                ? 'Revise os dados antes de criar a empresa:'
                : 'Revise os dados antes de salvar as alterações:'}
            </Typography>
            <Box>
              <Typography variant="subtitle2">Nome</Typography>
              <Typography variant="body1">{pendingValues?.name}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">Descrição</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {pendingValues?.description}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">Ativa</Typography>
              <Typography variant="body1">
                {pendingValues?.isActive ? 'Sim' : 'Não'}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelConfirm} disabled={isSaving}>
            Voltar
          </Button>
          <Button variant="contained" onClick={handleConfirm} disabled={isSaving}>
            {isSaving ? (
              <CircularProgress size={20} color="inherit" />
            ) : confirmMode === 'create' ? (
              'Criar empresa'
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <CompanyUsersDrawer
        company={selectedCompany}
        open={selectedCompanyId !== null}
        onClose={handleCloseCompanyPanel}
      />
    </DashboardLayout>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof TypeError) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Erro ao salvar empresa. Tente novamente.';
}
