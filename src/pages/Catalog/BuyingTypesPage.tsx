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

import {
  createBuyingTypes,
  getBuyingTypes,
  updateBuyingTypes,
} from '@/api/buying-type';
import { ApiError } from '@/api/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CatalogTabs } from '@/pages/Catalog/CatalogTabs';
import { useAuth } from '@/auth/useAuth';
import { hasMinRole } from '@/auth/roles';
import type { BuyingTypeSummary } from '@/types/buying-type';
import { getErrorMessage } from '@/utils/errors';

const buyingTypeSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  isActive: z.boolean(),
});

type BuyingTypeFormValues = z.infer<typeof buyingTypeSchema>;
type DialogMode = 'create' | 'edit' | null;

export function BuyingTypesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEdit = hasMinRole(user?.role ?? 'viewer', 'superadmin');
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingItem, setEditingItem] = useState<BuyingTypeSummary | null>(
    null,
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState<'create' | 'edit' | null>(
    null,
  );
  const [pendingValues, setPendingValues] =
    useState<BuyingTypeFormValues | null>(null);

  const {
    data: buyingTypes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['buying-types'],
    queryFn: getBuyingTypes,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BuyingTypeFormValues>({
    resolver: zodResolver(buyingTypeSchema),
    defaultValues: { name: '', description: '', isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: createBuyingTypes,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['buying-types'] });
      handleCloseAllDialogs();
    },
    onError: (err) =>
      setApiError(getErrorMessage(err, 'Erro ao criar tipo de compra.')),
  });

  const updateMutation = useMutation({
    mutationFn: updateBuyingTypes,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['buying-types'] });
      handleCloseAllDialogs();
    },
    onError: (err) =>
      setApiError(getErrorMessage(err, 'Erro ao salvar tipo de compra.')),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleOpenCreate = () => {
    reset({ name: '', description: '', isActive: true });
    setEditingItem(null);
    setDialogMode('create');
  };

  const handleOpenEdit = (item: BuyingTypeSummary) => {
    setEditingItem(item);
    reset({ name: item.name, description: '', isActive: item.isActive });
    void import('@/api/buying-type').then(({ getBuyingType }) =>
      getBuyingType(item.id).then((detail) => {
        reset({
          name: detail.name,
          description: detail.description,
          isActive: detail.isActive,
        });
      }),
    );
    setDialogMode('edit');
  };

  const handleCloseAllDialogs = () => {
    setDialogMode(null);
    setEditingItem(null);
    setApiError(null);
    setConfirmMode(null);
    setPendingValues(null);
  };

  const onSubmit = (values: BuyingTypeFormValues) => {
    setPendingValues(values);
    setConfirmMode(dialogMode === 'create' ? 'create' : 'edit');
  };

  const handleConfirm = () => {
    if (!pendingValues) return;

    if (confirmMode === 'create') {
      createMutation.mutate({ buyingTypes: [pendingValues] });
      return;
    }

    if (confirmMode === 'edit' && editingItem) {
      updateMutation.mutate({
        buyingTypes: [{ id: editingItem.id, ...pendingValues }],
      });
    }
  };

  const listError =
    error instanceof ApiError
      ? error.message
      : error
        ? 'Erro ao carregar tipos de compra.'
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
                Catálogo
              </Typography>
              {canEdit && (
                <Button variant="contained" onClick={handleOpenCreate}>
                  Novo tipo de compra
                </Button>
              )}
            </Stack>
            <CatalogTabs />
            <Typography variant="body2" color="text.secondary">
              Tipos de compra
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
                    <TableCell>Ativo</TableCell>
                    {canEdit && <TableCell align="right">Ações</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {buyingTypes.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.isActive ? 'Sim' : 'Não'}
                          size="small"
                          color={item.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      {canEdit && (
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => handleOpenEdit(item)}
                          >
                            Editar
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </Container>

      {canEdit && (
        <>
          <Dialog
            open={dialogMode !== null}
            onClose={() => !isSaving && handleCloseAllDialogs()}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {dialogMode === 'create'
                ? 'Novo tipo de compra'
                : 'Editar tipo de compra'}
            </DialogTitle>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
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
                        error={!!errors.name}
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
                        multiline
                        minRows={2}
                        error={!!errors.description}
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
                <Button onClick={handleCloseAllDialogs} disabled={isSaving}>
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
            <DialogTitle>Confirmar</DialogTitle>
            <DialogContent>
              {apiError && <Alert severity="error">{apiError}</Alert>}
              <Typography variant="body1">{pendingValues?.name}</Typography>
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
                Confirmar
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
}
