import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { getCatalog } from '@/api/bridge-catalog';
import { getClients } from '@/api/client-api';
import {
  createPlatformAccount,
  deletePlatformAccounts,
  getPlatformAccounts,
  updatePlatformAccounts,
} from '@/api/platform-account';
import { getPlatforms } from '@/api/platform';
import { BridgePageShell } from '@/pages/Bridge/BridgePageShell';
import { toggleAllInSet, toggleIdInSet } from '@/pages/Bridge/catalogHelpers';
import { BulkConfirmDialog } from '@/pages/Bridge/components/BulkConfirmDialog';
import { CheckboxDataTable } from '@/pages/Bridge/components/CheckboxDataTable';
import type { CatalogItem, PlatformAccountSummary } from '@/types/bridge';
import { getErrorMessage } from '@/utils/errors';

type ConfirmAction =
  | { type: 'associate' }
  | { type: 'remove' }
  | { type: 'changeClient'; newClientId: string }
  | null;

export function AccountMatchingPage() {
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [availableSelected, setAvailableSelected] = useState<Set<string>>(
    new Set(),
  );
  const [linkedSelected, setLinkedSelected] = useState<Set<string>>(new Set());
  const [changeClientId, setChangeClientId] = useState('');
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const targetsReady = Boolean(clientId && platformId);

  const { data: platforms = [] } = useQuery({
    queryKey: ['platforms'],
    queryFn: getPlatforms,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  const availableQuery = useQuery({
    queryKey: ['bridge-catalog', platformId, 'account', true],
    queryFn: () =>
      getCatalog(platformId, {
        objectType: 'account',
        unmatchedOnly: true,
      }),
    enabled: targetsReady,
  });

  const linkedQuery = useQuery({
    queryKey: ['platform-accounts', clientId, platformId],
    queryFn: () =>
      getPlatformAccounts({ clientId, platformId }),
    enabled: targetsReady,
  });

  const availableItems = availableQuery.data ?? [];
  const linkedAccounts = linkedQuery.data ?? [];

  const availableByExternalId = useMemo(() => {
    const map = new Map<string, CatalogItem>();
    for (const item of availableItems) {
      map.set(item.accountId, item);
    }
    return map;
  }, [availableItems]);

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['bridge-catalog'] }),
      queryClient.invalidateQueries({ queryKey: ['platform-accounts'] }),
    ]);
    setAvailableSelected(new Set());
    setLinkedSelected(new Set());
  };

  const associateMutation = useMutation({
    mutationFn: async () => {
      const selected = [...availableSelected];
      await Promise.all(
        selected.map((externalAccountId) => {
          const item = availableByExternalId.get(externalAccountId);
          if (!item) {
            throw new Error('Conta ETL não encontrada na seleção');
          }
          return createPlatformAccount({
            externalAccountId,
            name: item.accountName,
            clientId,
            platformId,
          });
        }),
      );
    },
    onSuccess: async () => {
      setConfirm(null);
      setApiError(null);
      await invalidate();
    },
    onError: (err) => {
      setApiError(getErrorMessage(err, 'Erro ao associar contas.'));
      setConfirm(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: () =>
      deletePlatformAccounts({ ids: [...linkedSelected] }),
    onSuccess: async () => {
      setConfirm(null);
      setApiError(null);
      await invalidate();
    },
    onError: (err) => {
      setApiError(getErrorMessage(err, 'Erro ao remover contas.'));
      setConfirm(null);
    },
  });

  const changeClientMutation = useMutation({
    mutationFn: (newClientId: string) =>
      updatePlatformAccounts({
        platformAccounts: [...linkedSelected].map((id) => ({
          id,
          clientId: newClientId,
        })),
      }),
    onSuccess: async () => {
      setConfirm(null);
      setChangeClientId('');
      setApiError(null);
      await invalidate();
    },
    onError: (err) => {
      setApiError(getErrorMessage(err, 'Erro ao alterar cliente.'));
      setConfirm(null);
    },
  });

  const isBusy =
    associateMutation.isPending ||
    removeMutation.isPending ||
    changeClientMutation.isPending;

  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.type === 'associate') associateMutation.mutate();
    if (confirm.type === 'remove') removeMutation.mutate();
    if (confirm.type === 'changeClient') {
      changeClientMutation.mutate(confirm.newClientId);
    }
  };

  const confirmCopy = (() => {
    if (!confirm) return { title: '', description: '' };
    if (confirm.type === 'associate') {
      return {
        title: 'Associar contas',
        description: `Associar ${availableSelected.size} conta(s) ETL ao cliente selecionado?`,
      };
    }
    if (confirm.type === 'remove') {
      return {
        title: 'Remover associações',
        description: `Remover ${linkedSelected.size} conta(s)? Todos os mapeamentos de campanha, ad group e anúncio vinculados serão excluídos permanentemente.`,
      };
    }
    const clientName =
      clients.find((client) => client.id === confirm.newClientId)?.name ??
      'cliente selecionado';
    return {
      title: 'Alterar cliente',
      description: `Mover ${linkedSelected.size} conta(s) para "${clientName}"? Todos os mapeamentos filhos dessas contas serão excluídos permanentemente.`,
    };
  })();

  return (
    <BridgePageShell
      title="Vinculação de contas"
      description="Selecione o cliente e a plataforma, depois associe contas ETL ainda sem vínculo (pool global). Uma conta só pode pertencer a um cliente."
    >
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { md: 'center' } }}
        >
          <FormControl sx={{ minWidth: 220 }} size="small">
            <InputLabel id="account-client-label">Cliente</InputLabel>
            <Select
              labelId="account-client-label"
              label="Cliente"
              value={clientId}
              onChange={(event) => {
                setClientId(event.target.value);
                setAvailableSelected(new Set());
                setLinkedSelected(new Set());
              }}
            >
              {clients
                .filter((client) => client.isActive)
                .map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 220 }} size="small">
            <InputLabel id="account-platform-label">Plataforma</InputLabel>
            <Select
              labelId="account-platform-label"
              label="Plataforma"
              value={platformId}
              onChange={(event) => {
                setPlatformId(event.target.value);
                setAvailableSelected(new Set());
                setLinkedSelected(new Set());
              }}
            >
              {platforms
                .filter((platform) => platform.isActive)
                .map((platform) => (
                  <MenuItem key={platform.id} value={platform.id}>
                    {platform.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Stack>

        {!targetsReady && (
          <Alert severity="info">
            Selecione cliente e plataforma para carregar as contas.
          </Alert>
        )}

        {apiError && <Alert severity="error">{apiError}</Alert>}

        {targetsReady && (availableQuery.isLoading || linkedQuery.isLoading) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {targetsReady && availableQuery.isError && (
          <Alert severity="error">
            {getErrorMessage(
              availableQuery.error,
              'Erro ao carregar contas disponíveis.',
            )}
          </Alert>
        )}

        {targetsReady && linkedQuery.isError && (
          <Alert severity="error">
            {getErrorMessage(
              linkedQuery.error,
              'Erro ao carregar contas vinculadas.',
            )}
          </Alert>
        )}

        {targetsReady &&
          !availableQuery.isLoading &&
          !linkedQuery.isLoading && (
            <>
              <Box>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{
                    mb: 1,
                    alignItems: { sm: 'center' },
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="h6">Disponíveis (ETL)</Typography>
                  <Button
                    variant="contained"
                    disabled={availableSelected.size === 0 || isBusy}
                    onClick={() => setConfirm({ type: 'associate' })}
                  >
                    Associar selecionados ({availableSelected.size})
                  </Button>
                </Stack>
                <CheckboxDataTable
                  rows={availableItems}
                  getRowId={(row) => row.accountId}
                  selectedIds={availableSelected}
                  onToggle={(id) =>
                    setAvailableSelected((prev) => toggleIdInSet(prev, id))
                  }
                  onToggleAll={(ids) =>
                    setAvailableSelected((prev) => toggleAllInSet(prev, ids))
                  }
                  columns={[
                    {
                      id: 'externalId',
                      header: 'ID externo',
                      render: (row) => row.accountId,
                    },
                    {
                      id: 'name',
                      header: 'Nome',
                      render: (row) => row.accountName,
                    },
                  ]}
                  emptyMessage="Nenhuma conta ETL disponível (todas já estão vinculadas)."
                />
              </Box>

              <Box>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{
                    mb: 1,
                    alignItems: { sm: 'center' },
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                  }}
                >
                  <Typography variant="h6">
                    Vinculados a este cliente
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel id="change-client-label">
                        Novo cliente
                      </InputLabel>
                      <Select
                        labelId="change-client-label"
                        label="Novo cliente"
                        value={changeClientId}
                        onChange={(event) =>
                          setChangeClientId(event.target.value)
                        }
                        disabled={linkedSelected.size === 0 || isBusy}
                      >
                        {clients
                          .filter(
                            (client) =>
                              client.isActive && client.id !== clientId,
                          )
                          .map((client) => (
                            <MenuItem key={client.id} value={client.id}>
                              {client.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      disabled={
                        linkedSelected.size === 0 ||
                        !changeClientId ||
                        isBusy
                      }
                      onClick={() =>
                        setConfirm({
                          type: 'changeClient',
                          newClientId: changeClientId,
                        })
                      }
                    >
                      Alterar cliente
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      disabled={linkedSelected.size === 0 || isBusy}
                      onClick={() => setConfirm({ type: 'remove' })}
                    >
                      Remover ({linkedSelected.size})
                    </Button>
                  </Stack>
                </Stack>
                <CheckboxDataTable
                  rows={linkedAccounts}
                  getRowId={(row: PlatformAccountSummary) => row.id}
                  selectedIds={linkedSelected}
                  onToggle={(id) =>
                    setLinkedSelected((prev) => toggleIdInSet(prev, id))
                  }
                  onToggleAll={(ids) =>
                    setLinkedSelected((prev) => toggleAllInSet(prev, ids))
                  }
                  columns={[
                    {
                      id: 'externalId',
                      header: 'ID externo',
                      render: (row) => row.externalAccountId,
                    },
                    {
                      id: 'name',
                      header: 'Nome',
                      render: (row) => row.name,
                    },
                  ]}
                  emptyMessage="Nenhuma conta vinculada a este cliente nesta plataforma."
                />
              </Box>
            </>
          )}
      </Stack>

      <BulkConfirmDialog
        open={confirm !== null}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={
          confirm?.type === 'remove' || confirm?.type === 'changeClient'
            ? 'Excluir e continuar'
            : 'Associar'
        }
        confirmColor={
          confirm?.type === 'remove' || confirm?.type === 'changeClient'
            ? 'error'
            : 'primary'
        }
        loading={isBusy}
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
      />
    </BridgePageShell>
  );
}
