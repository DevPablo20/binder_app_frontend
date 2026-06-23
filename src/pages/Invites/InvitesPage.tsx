import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { cancelInvite, getInvites, resendInvite } from '@/api/invite';
import { ApiError } from '@/api/client';
import { ROLE_LABELS } from '@/auth/roles';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CreateInviteDialog } from '@/pages/Invites/CreateInviteDialog';
import type { InviteStatus, InviteSummary } from '@/types/invite';

const STATUS_LABELS: Record<InviteStatus, string> = {
  pending: 'Pendente',
  accepted: 'Aceito',
  refused: 'Recusado',
  expired: 'Expirado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<
  InviteStatus,
  'default' | 'success' | 'warning' | 'error' | 'info'
> = {
  pending: 'warning',
  accepted: 'success',
  refused: 'default',
  expired: 'error',
  cancelled: 'default',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function InvitesPage() {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [actionInviteId, setActionInviteId] = useState<string | null>(null);

  const {
    data: invites = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['invites'],
    queryFn: getInvites,
  });

  const invalidateInvites = () => {
    void queryClient.invalidateQueries({ queryKey: ['invites'] });
  };

  const cancelMutation = useMutation({
    mutationFn: cancelInvite,
    onSuccess: () => {
      setApiError(null);
      setActionInviteId(null);
      invalidateInvites();
    },
    onError: (err) => {
      setActionInviteId(null);
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('Erro ao cancelar convite. Tente novamente.');
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendInvite,
    onSuccess: () => {
      setApiError(null);
      setActionInviteId(null);
      invalidateInvites();
    },
    onError: (err) => {
      setActionInviteId(null);
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('Erro ao reenviar convite. Tente novamente.');
      }
    },
  });

  const handleCancel = (invite: InviteSummary) => {
    setApiError(null);
    setActionInviteId(invite.id);
    cancelMutation.mutate(invite.id);
  };

  const handleResend = (invite: InviteSummary) => {
    setApiError(null);
    setActionInviteId(invite.id);
    resendMutation.mutate(invite.id);
  };

  const isActionPending = cancelMutation.isPending || resendMutation.isPending;

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
            sx={{
              alignItems: { sm: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="h4" component="h1">
              Convites
            </Typography>
            <Button variant="contained" onClick={() => setCreateOpen(true)}>
              Novo convite
            </Button>
          </Stack>

          {apiError && <Alert severity="error">{apiError}</Alert>}
          {error instanceof ApiError && (
            <Alert severity="error">{error.message}</Alert>
          )}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>E-mail</TableCell>
                    <TableCell>Perfil</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Expira em</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invites.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ py: 3 }}
                        >
                          Nenhum convite enviado ainda.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invites.map((invite) => {
                      const isRowLoading =
                        isActionPending && actionInviteId === invite.id;

                      return (
                        <TableRow key={invite.id}>
                          <TableCell>{invite.email}</TableCell>
                          <TableCell>{ROLE_LABELS[invite.role]}</TableCell>
                          <TableCell>
                            <Chip
                              label={STATUS_LABELS[invite.status]}
                              color={STATUS_COLORS[invite.status]}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatDate(invite.expiresAt)}</TableCell>
                          <TableCell align="right">
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ justifyContent: 'flex-end' }}
                            >
                              {invite.status === 'pending' && (
                                <Button
                                  size="small"
                                  color="error"
                                  disabled={isActionPending}
                                  onClick={() => handleCancel(invite)}
                                >
                                  {isRowLoading ? (
                                    <CircularProgress size={18} />
                                  ) : (
                                    'Cancelar'
                                  )}
                                </Button>
                              )}
                              {invite.status === 'expired' && (
                                <Button
                                  size="small"
                                  disabled={isActionPending}
                                  onClick={() => handleResend(invite)}
                                >
                                  {isRowLoading ? (
                                    <CircularProgress size={18} />
                                  ) : (
                                    'Reenviar'
                                  )}
                                </Button>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </Container>

      <CreateInviteDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={invalidateInvites}
      />
    </DashboardLayout>
  );
}
