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

import { ApiError } from '@/api/client';
import { createPlatform, getPlatforms, updatePlatforms } from '@/api/platform';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CatalogTabs } from '@/pages/Catalog/CatalogTabs';
import { PlatformChannelsDrawer } from '@/pages/Catalog/PlatformChannelsDrawer';
import { useAuth } from '@/auth/useAuth';
import { hasMinRole } from '@/auth/roles';
import type { PlatformSummary } from '@/types/platform';
import { getErrorMessage } from '@/utils/errors';

const platformSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  isActive: z.boolean(),
});

type PlatformFormValues = z.infer<typeof platformSchema>;
type DialogMode = 'create' | 'edit' | null;

export function PlatformsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEdit = hasMinRole(user?.role ?? 'viewer', 'superadmin');
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingPlatform, setEditingPlatform] =
    useState<PlatformSummary | null>(null);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(
    null,
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState<'create' | 'edit' | null>(
    null,
  );
  const [pendingValues, setPendingValues] = useState<PlatformFormValues | null>(
    null,
  );

  const {
    data: platforms = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['platforms'],
    queryFn: getPlatforms,
  });

  const selectedPlatform =
    platforms.find((platform) => platform.id === selectedPlatformId) ?? null;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlatformFormValues>({
    resolver: zodResolver(platformSchema),
    defaultValues: { name: '', description: '', isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: createPlatform,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platforms'] });
      handleCloseAllDialogs();
    },
    onError: (err) =>
      setApiError(getErrorMessage(err, 'Erro ao criar plataforma.')),
  });

  const updateMutation = useMutation({
    mutationFn: updatePlatforms,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platforms'] });
      handleCloseAllDialogs();
    },
    onError: (err) =>
      setApiError(getErrorMessage(err, 'Erro ao salvar plataforma.')),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleOpenCreate = () => {
    reset({ name: '', description: '', isActive: true });
    setEditingPlatform(null);
    setApiError(null);
    setDialogMode('create');
  };

  const handleOpenEdit = (platform: PlatformSummary) => {
    setEditingPlatform(platform);
    setApiError(null);
    reset({
      name: platform.name,
      description: '',
      isActive: platform.isActive,
    });
    void import('@/api/platform').then(({ getPlatform }) =>
      getPlatform(platform.id).then((detail) => {
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
    setEditingPlatform(null);
    setApiError(null);
    setConfirmMode(null);
    setPendingValues(null);
  };

  const onSubmit = (values: PlatformFormValues) => {
    setPendingValues(values);
    setConfirmMode(dialogMode === 'create' ? 'create' : 'edit');
  };

  const handleConfirm = () => {
    if (!pendingValues) return;
    if (confirmMode === 'create') {
      createMutation.mutate(pendingValues);
      return;
    }
    if (confirmMode === 'edit' && editingPlatform) {
      updateMutation.mutate({
        platforms: [{ id: editingPlatform.id, ...pendingValues }],
      });
    }
  };

  const listError =
    error instanceof ApiError
      ? error.message
      : error
        ? 'Erro ao carregar plataformas.'
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
                  Nova plataforma
                </Button>
              )}
            </Stack>
            <CatalogTabs />
            <Typography variant="body2" color="text.secondary">
              Plataformas de mídia
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
                    <TableCell>Ativa</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {platforms.map((platform) => (
                    <TableRow key={platform.id} hover>
                      <TableCell>{platform.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={platform.isActive ? 'Sim' : 'Não'}
                          size="small"
                          color={platform.isActive ? 'success' : 'default'}
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
                            onClick={() => setSelectedPlatformId(platform.id)}
                          >
                            Canais
                          </Button>
                          {canEdit && (
                            <Button
                              size="small"
                              onClick={() => handleOpenEdit(platform)}
                            >
                              Editar
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </Container>

      <PlatformChannelsDrawer
        platform={selectedPlatform}
        open={selectedPlatformId !== null}
        onClose={() => setSelectedPlatformId(null)}
      />

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
                ? 'Nova plataforma'
                : 'Editar plataforma'}
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
                        minRows={3}
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
                        label="Ativa"
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
