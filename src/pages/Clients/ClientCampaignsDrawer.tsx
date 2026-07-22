import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
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
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { createCampaign, getCampaigns, updateCampaigns } from '@/api/campaign';
import { CampaignGroupingsDrawer } from '@/pages/Groupings/CampaignGroupingsDrawer';
import type { CampaignSummary } from '@/types/campaign';
import type { ClientSummary } from '@/types/client';
import { getErrorMessage } from '@/utils/errors';

const campaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  isActive: z.boolean(),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

interface ClientCampaignsDrawerProps {
  client: ClientSummary | null;
  open: boolean;
  onClose: () => void;
}

export function ClientCampaignsDrawer({
  client,
  open,
  onClose,
}: ClientCampaignsDrawerProps) {
  const queryClient = useQueryClient();
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingCampaign, setEditingCampaign] =
    useState<CampaignSummary | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState<'create' | 'edit' | null>(
    null,
  );
  const [pendingValues, setPendingValues] = useState<CampaignFormValues | null>(
    null,
  );

  const { data: allCampaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: getCampaigns,
    enabled: open,
  });

  const campaigns = useMemo(
    () =>
      client
        ? allCampaigns.filter((campaign) => campaign.clientId === client.id)
        : [],
    [allCampaigns, client],
  );

  const selectedCampaign =
    campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: { name: '', description: '', isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      handleCloseFormDialogs();
    },
    onError: (err) =>
      setApiError(getErrorMessage(err, 'Erro ao criar campanha.')),
  });

  const updateMutation = useMutation({
    mutationFn: updateCampaigns,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      handleCloseFormDialogs();
    },
    onError: (err) =>
      setApiError(getErrorMessage(err, 'Erro ao salvar campanha.')),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleCloseFormDialogs = () => {
    setDialogMode(null);
    setEditingCampaign(null);
    setApiError(null);
    setConfirmMode(null);
    setPendingValues(null);
    reset({ name: '', description: '', isActive: true });
  };

  const handleClose = () => {
    if (isSaving) return;
    handleCloseFormDialogs();
    setSelectedCampaignId(null);
    onClose();
  };

  const handleOpenCreate = () => {
    setApiError(null);
    setEditingCampaign(null);
    reset({ name: '', description: '', isActive: true });
    setDialogMode('create');
  };

  const handleOpenEdit = (campaign: CampaignSummary) => {
    setApiError(null);
    setEditingCampaign(campaign);
    reset({
      name: campaign.name,
      description: '',
      isActive: campaign.isActive,
    });
    void import('@/api/campaign').then(({ getCampaign }) =>
      getCampaign(campaign.id).then((detail) => {
        reset({
          name: detail.name,
          description: detail.description,
          isActive: detail.isActive,
        });
      }),
    );
    setDialogMode('edit');
  };

  const onSubmit = (values: CampaignFormValues) => {
    setPendingValues(values);
    setConfirmMode(dialogMode === 'create' ? 'create' : 'edit');
  };

  const handleConfirm = () => {
    if (!pendingValues || !client) return;

    if (confirmMode === 'create') {
      createMutation.mutate({ ...pendingValues, clientId: client.id });
      return;
    }

    if (confirmMode === 'edit' && editingCampaign) {
      updateMutation.mutate({
        campaigns: [{ id: editingCampaign.id, ...pendingValues }],
      });
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 480 } } } }}
      >
        {client && (
          <Box
            sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                p: 2.5,
              }}
            >
              <Box>
                <Typography variant="h6">{client.name}</Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Campanhas
                </Typography>
              </Box>
              <IconButton onClick={handleClose} aria-label="Fechar">
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleOpenCreate}
              >
                Nova campanha
              </Button>
            </Box>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer sx={{ flex: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Ativa</TableCell>
                      <TableCell align="right">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {campaigns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ py: 2 }}
                          >
                            Nenhuma campanha.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell>{campaign.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={campaign.isActive ? 'Sim' : 'Não'}
                              size="small"
                              color={campaign.isActive ? 'success' : 'default'}
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
                                onClick={() =>
                                  setSelectedCampaignId(campaign.id)
                                }
                              >
                                Agrupamentos
                              </Button>
                              <Button
                                size="small"
                                onClick={() => handleOpenEdit(campaign)}
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
          </Box>
        )}
      </Drawer>

      <CampaignGroupingsDrawer
        campaign={selectedCampaign}
        open={selectedCampaignId !== null}
        onClose={() => setSelectedCampaignId(null)}
      />

      <Dialog
        open={dialogMode !== null}
        onClose={() => !isSaving && handleCloseFormDialogs()}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Nova campanha' : 'Editar campanha'}
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
                    label="Ativa"
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => handleCloseFormDialogs()}
              disabled={isSaving}
            >
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
  );
}
