import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
  ListItemText,
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

import { createChannels, getChannels, updateChannels } from '@/api/channel';
import { getBuyingTypes } from '@/api/buying-type';
import { ApiError } from '@/api/client';
import { getPlatforms } from '@/api/platform';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CatalogTabs } from '@/pages/Catalog/CatalogTabs';
import { useAuth } from '@/auth/useAuth';
import { hasMinRole } from '@/auth/roles';
import type { ChannelSummary } from '@/types/channel';
import { getErrorMessage } from '@/utils/errors';

const channelSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  platformId: z.string().min(1),
  buyingTypeIds: z.array(z.string()),
  isActive: z.boolean(),
});

type ChannelFormValues = z.infer<typeof channelSchema>;
type DialogMode = 'create' | 'edit' | null;

export function ChannelsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEdit = hasMinRole(user?.role ?? 'viewer', 'superadmin');
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingChannel, setEditingChannel] = useState<ChannelSummary | null>(
    null,
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState<'create' | 'edit' | null>(
    null,
  );
  const [pendingValues, setPendingValues] = useState<ChannelFormValues | null>(
    null,
  );

  const {
    data: channels = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['channels'],
    queryFn: getChannels,
  });

  const { data: platforms = [] } = useQuery({
    queryKey: ['platforms'],
    queryFn: getPlatforms,
  });

  const { data: buyingTypes = [] } = useQuery({
    queryKey: ['buying-types'],
    queryFn: getBuyingTypes,
  });

  const platformNameById = useMemo(
    () => new Map(platforms.map((platform) => [platform.id, platform.name])),
    [platforms],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChannelFormValues>({
    resolver: zodResolver(channelSchema),
    defaultValues: {
      name: '',
      description: '',
      platformId: platforms[0]?.id ?? '',
      buyingTypeIds: [],
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: createChannels,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['channels'] });
      handleCloseAllDialogs();
    },
    onError: (err) => setApiError(getErrorMessage(err, 'Erro ao criar canal.')),
  });

  const updateMutation = useMutation({
    mutationFn: updateChannels,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['channels'] });
      handleCloseAllDialogs();
    },
    onError: (err) =>
      setApiError(getErrorMessage(err, 'Erro ao salvar canal.')),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleOpenCreate = () => {
    reset({
      name: '',
      description: '',
      platformId: platforms[0]?.id ?? '',
      buyingTypeIds: [],
      isActive: true,
    });
    setEditingChannel(null);
    setDialogMode('create');
  };

  const handleOpenEdit = (channel: ChannelSummary) => {
    setEditingChannel(channel);
    reset({
      name: channel.name,
      description: '',
      platformId: channel.platformId,
      buyingTypeIds: [],
      isActive: channel.isActive,
    });
    void import('@/api/channel').then(({ getChannel }) =>
      getChannel(channel.id).then((detail) => {
        reset({
          name: detail.name,
          description: detail.description,
          platformId: detail.platformId,
          buyingTypeIds: detail.buyingTypeIds,
          isActive: detail.isActive,
        });
      }),
    );
    setDialogMode('edit');
  };

  const handleCloseAllDialogs = () => {
    setDialogMode(null);
    setEditingChannel(null);
    setApiError(null);
    setConfirmMode(null);
    setPendingValues(null);
  };

  const onSubmit = (values: ChannelFormValues) => {
    setPendingValues(values);
    setConfirmMode(dialogMode === 'create' ? 'create' : 'edit');
  };

  const handleConfirm = () => {
    if (!pendingValues) return;

    if (confirmMode === 'create') {
      createMutation.mutate({
        platformId: pendingValues.platformId,
        channels: [
          {
            name: pendingValues.name,
            description: pendingValues.description,
            buyingTypeIds: pendingValues.buyingTypeIds,
            isActive: pendingValues.isActive,
          },
        ],
      });
      return;
    }

    if (confirmMode === 'edit' && editingChannel) {
      updateMutation.mutate({
        channels: [{ id: editingChannel.id, ...pendingValues }],
      });
    }
  };

  const listError =
    error instanceof ApiError
      ? error.message
      : error
        ? 'Erro ao carregar canais.'
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
                  Novo canal
                </Button>
              )}
            </Stack>
            <CatalogTabs />
            <Typography variant="body2" color="text.secondary">
              Canais de mídia
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
                    <TableCell>Plataforma</TableCell>
                    <TableCell>Ativo</TableCell>
                    {canEdit && <TableCell align="right">Ações</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {channels.map((channel) => (
                    <TableRow key={channel.id} hover>
                      <TableCell>{channel.name}</TableCell>
                      <TableCell>
                        {platformNameById.get(channel.platformId) ??
                          channel.platformId}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={channel.isActive ? 'Sim' : 'Não'}
                          size="small"
                          color={channel.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      {canEdit && (
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => handleOpenEdit(channel)}
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
              {dialogMode === 'create' ? 'Novo canal' : 'Editar canal'}
            </DialogTitle>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                  {apiError && <Alert severity="error">{apiError}</Alert>}
                  <Controller
                    name="platformId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel id="channel-platform-label">
                          Plataforma
                        </InputLabel>
                        <Select
                          {...field}
                          labelId="channel-platform-label"
                          label="Plataforma"
                        >
                          {platforms.map((platform) => (
                            <MenuItem key={platform.id} value={platform.id}>
                              {platform.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
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
                    name="buyingTypeIds"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel id="channel-buying-types-label">
                          Tipos de compra
                        </InputLabel>
                        <Select
                          {...field}
                          multiple
                          labelId="channel-buying-types-label"
                          label="Tipos de compra"
                          renderValue={(selected) =>
                            selected
                              .map(
                                (id) =>
                                  buyingTypes.find((type) => type.id === id)
                                    ?.name ?? id,
                              )
                              .join(', ')
                          }
                        >
                          {buyingTypes.map((type) => (
                            <MenuItem key={type.id} value={type.id}>
                              <Checkbox
                                checked={field.value.includes(type.id)}
                              />
                              <ListItemText primary={type.name} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
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
