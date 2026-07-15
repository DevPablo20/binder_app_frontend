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

import { createGrouping, getGroupings, updateGroupings } from '@/api/grouping';
import { SubGroupingsDrawer } from '@/pages/Groupings/SubGroupingsDrawer';
import type { CampaignSummary } from '@/types/campaign';
import type { GroupingSummary } from '@/types/grouping';
import { getErrorMessage } from '@/utils/errors';

const groupingSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  isActive: z.boolean(),
});

type GroupingFormValues = z.infer<typeof groupingSchema>;

interface CampaignGroupingsDrawerProps {
  campaign: CampaignSummary | null;
  open: boolean;
  onClose: () => void;
}

export function CampaignGroupingsDrawer({
  campaign,
  open,
  onClose,
}: CampaignGroupingsDrawerProps) {
  const queryClient = useQueryClient();
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingGrouping, setEditingGrouping] =
    useState<GroupingSummary | null>(null);
  const [selectedGroupingId, setSelectedGroupingId] = useState<string | null>(
    null,
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState<'create' | 'edit' | null>(
    null,
  );
  const [pendingValues, setPendingValues] = useState<GroupingFormValues | null>(
    null,
  );

  const { data: allGroupings = [], isLoading } = useQuery({
    queryKey: ['groupings'],
    queryFn: getGroupings,
    enabled: open,
  });

  const groupings = useMemo(
    () =>
      campaign
        ? allGroupings.filter(
            (grouping) => grouping.campaignId === campaign.id,
          )
        : [],
    [allGroupings, campaign],
  );

  const selectedGrouping =
    groupings.find((grouping) => grouping.id === selectedGroupingId) ?? null;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GroupingFormValues>({
    resolver: zodResolver(groupingSchema),
    defaultValues: { name: '', description: '', isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: createGrouping,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['groupings'] });
      handleCloseFormDialogs();
    },
    onError: (err) =>
      setApiError(getErrorMessage(err, 'Erro ao criar agrupamento.')),
  });

  const updateMutation = useMutation({
    mutationFn: updateGroupings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['groupings'] });
      handleCloseFormDialogs();
    },
    onError: (err) =>
      setApiError(getErrorMessage(err, 'Erro ao salvar agrupamento.')),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleCloseFormDialogs = () => {
    setDialogMode(null);
    setEditingGrouping(null);
    setApiError(null);
    setConfirmMode(null);
    setPendingValues(null);
    reset({ name: '', description: '', isActive: true });
  };

  const handleClose = () => {
    if (isSaving) return;
    handleCloseFormDialogs();
    setSelectedGroupingId(null);
    onClose();
  };

  const handleOpenCreate = () => {
    setApiError(null);
    setEditingGrouping(null);
    reset({ name: '', description: '', isActive: true });
    setDialogMode('create');
  };

  const handleOpenEdit = (grouping: GroupingSummary) => {
    setApiError(null);
    setEditingGrouping(grouping);
    reset({
      name: grouping.name,
      description: '',
      isActive: grouping.isActive,
    });
    void import('@/api/grouping').then(({ getGrouping }) =>
      getGrouping(grouping.id).then((detail) => {
        reset({
          name: detail.name,
          description: detail.description,
          isActive: detail.isActive,
        });
      }),
    );
    setDialogMode('edit');
  };

  const onSubmit = (values: GroupingFormValues) => {
    setPendingValues(values);
    setConfirmMode(dialogMode === 'create' ? 'create' : 'edit');
  };

  const handleConfirm = () => {
    if (!pendingValues || !campaign) return;

    if (confirmMode === 'create') {
      createMutation.mutate({ ...pendingValues, campaignId: campaign.id });
      return;
    }

    if (confirmMode === 'edit' && editingGrouping) {
      updateMutation.mutate({
        groupings: [{ id: editingGrouping.id, ...pendingValues }],
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
        {campaign && (
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
                <Typography variant="h6">{campaign.name}</Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Agrupamentos
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
                Novo agrupamento
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
                      <TableCell>Ativo</TableCell>
                      <TableCell align="right">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groupings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ py: 2 }}
                          >
                            Nenhum agrupamento.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupings.map((grouping) => (
                        <TableRow key={grouping.id}>
                          <TableCell>{grouping.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={grouping.isActive ? 'Sim' : 'Não'}
                              size="small"
                              color={grouping.isActive ? 'success' : 'default'}
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
                                  setSelectedGroupingId(grouping.id)
                                }
                              >
                                Sub-agrupamentos
                              </Button>
                              <Button
                                size="small"
                                onClick={() => handleOpenEdit(grouping)}
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

      <SubGroupingsDrawer
        grouping={selectedGrouping}
        open={selectedGroupingId !== null}
        onClose={() => setSelectedGroupingId(null)}
      />

      <Dialog
        open={dialogMode !== null}
        onClose={() => !isSaving && handleCloseFormDialogs()}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Novo agrupamento' : 'Editar agrupamento'}
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
                    label="Ativo"
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
