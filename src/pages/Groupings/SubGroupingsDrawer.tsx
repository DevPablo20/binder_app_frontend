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

import {
  createSubGroupings,
  getSubGroupings,
  updateSubGroupings,
} from '@/api/sub-grouping';
import type { GroupingSummary, SubGroupingSummary } from '@/types/grouping';
import { getErrorMessage } from '@/utils/errors';

const subGroupingSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  isActive: z.boolean(),
});

type SubGroupingFormValues = z.infer<typeof subGroupingSchema>;

interface SubGroupingsDrawerProps {
  grouping: GroupingSummary | null;
  open: boolean;
  onClose: () => void;
}

export function SubGroupingsDrawer({
  grouping,
  open,
  onClose,
}: SubGroupingsDrawerProps) {
  const queryClient = useQueryClient();
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<SubGroupingSummary | null>(
    null,
  );
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: allSubGroupings = [], isLoading } = useQuery({
    queryKey: ['sub-groupings'],
    queryFn: getSubGroupings,
    enabled: open,
  });

  const subGroupings = useMemo(
    () =>
      grouping
        ? allSubGroupings.filter((item) => item.groupingId === grouping.id)
        : [],
    [allSubGroupings, grouping],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubGroupingFormValues>({
    resolver: zodResolver(subGroupingSchema),
    defaultValues: { name: '', description: '', isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: createSubGroupings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sub-groupings'] });
      setDialogMode(null);
      setApiError(null);
      reset({ name: '', description: '', isActive: true });
    },
    onError: (err) =>
      setApiError(getErrorMessage(err, 'Erro ao criar sub-agrupamento.')),
  });

  const updateMutation = useMutation({
    mutationFn: updateSubGroupings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sub-groupings'] });
      setDialogMode(null);
      setEditingItem(null);
      setApiError(null);
    },
    onError: (err) =>
      setApiError(getErrorMessage(err, 'Erro ao salvar sub-agrupamento.')),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const resetDrawerState = () => {
    setDialogMode(null);
    setEditingItem(null);
    setApiError(null);
  };

  const handleClose = () => {
    if (isSaving) return;
    resetDrawerState();
    onClose();
  };

  const handleOpenCreate = () => {
    reset({ name: '', description: '', isActive: true });
    setEditingItem(null);
    setApiError(null);
    setDialogMode('create');
  };

  const handleOpenEdit = (item: SubGroupingSummary) => {
    setEditingItem(item);
    setApiError(null);
    reset({ name: item.name, description: '', isActive: item.isActive });
    void import('@/api/sub-grouping').then(({ getSubGrouping }) =>
      getSubGrouping(item.id).then((detail) => {
        reset({
          name: detail.name,
          description: detail.description,
          isActive: detail.isActive,
        });
      }),
    );
    setDialogMode('edit');
  };

  const onSubmit = (values: SubGroupingFormValues) => {
    if (!grouping) return;

    if (dialogMode === 'create') {
      createMutation.mutate({
        groupingId: grouping.id,
        subGroupings: [values],
      });
      return;
    }

    if (dialogMode === 'edit' && editingItem) {
      updateMutation.mutate({
        subGroupings: [{ id: editingItem.id, ...values }],
      });
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 420 } } } }}
      >
        {grouping && (
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
                <Typography variant="h6">{grouping.name}</Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Sub-agrupamentos
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
                Novo sub-agrupamento
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
                    {subGroupings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ py: 2 }}
                          >
                            Nenhum sub-agrupamento.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      subGroupings.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.isActive ? 'Sim' : 'Não'}
                              size="small"
                              color={item.isActive ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              onClick={() => handleOpenEdit(item)}
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
          </Box>
        )}
      </Drawer>

      <Dialog
        open={dialogMode !== null}
        onClose={() => !isSaving && setDialogMode(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create'
            ? 'Novo sub-agrupamento'
            : 'Editar sub-agrupamento'}
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
                    minRows={2}
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
            <Button onClick={() => setDialogMode(null)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              Salvar
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
