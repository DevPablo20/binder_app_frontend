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
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { getCatalog } from '@/api/bridge-catalog';
import { getClients } from '@/api/client-api';
import {
  createPlatformAccountsBulk,
  deletePlatformAccounts,
  getPlatformAccounts,
} from '@/api/platform-account';
import { getPlatforms } from '@/api/platform';
import { BridgePageShell } from '@/pages/Bridge/BridgePageShell';
import { toggleAllInSet, toggleIdInSet } from '@/pages/Bridge/catalogHelpers';
import { AssociateAccountsDialog } from '@/pages/Bridge/components/AssociateAccountsDialog';
import { BulkConfirmDialog } from '@/pages/Bridge/components/BulkConfirmDialog';
import { CheckboxDataTable } from '@/pages/Bridge/components/CheckboxDataTable';
import { getErrorMessage } from '@/utils/errors';

type ConfirmAction = { type: 'unmatch'; ids: string[] } | null;

function matchesNameSearch(name: string, search: string): boolean {
  if (!search.trim()) return true;
  return name.toLowerCase().includes(search.trim().toLowerCase());
}

export function AccountMatchingPage() {
  const queryClient = useQueryClient();
  const [platformId, setPlatformId] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [availableSelected, setAvailableSelected] = useState<Set<string>>(
    new Set(),
  );
  const [linkedSelected, setLinkedSelected] = useState<Set<string>>(new Set());
  const [associateOpen, setAssociateOpen] = useState(false);
  const [associateClientId, setAssociateClientId] = useState('');
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const targetsReady = Boolean(platformId);

  const { data: platforms = [] } = useQuery({
    queryKey: ['platforms'],
    queryFn: getPlatforms,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  const selectedPlatform = platforms.find(
    (platform) => platform.id === platformId,
  );

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
    queryKey: ['platform-accounts', platformId],
    queryFn: () => getPlatformAccounts({ platformId }),
    enabled: targetsReady,
  });

  const linkedItems = useMemo(
    () =>
      (linkedQuery.data ?? [])
        .filter((row) => matchesNameSearch(row.name, nameSearch))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [linkedQuery.data, nameSearch],
  );

  const availableItems = useMemo(() => {
    const platformName = selectedPlatform?.name ?? '';
    return (availableQuery.data ?? [])
      .filter((item) => matchesNameSearch(item.accountName, nameSearch))
      .map((item) => ({
        ...item,
        platformName: platformName || item.platform,
      }));
  }, [availableQuery.data, nameSearch, selectedPlatform?.name]);

  const selectedAvailableAccounts = useMemo(
    () =>
      availableItems.filter((item) => availableSelected.has(item.accountId)),
    [availableItems, availableSelected],
  );

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['bridge-catalog'] }),
      queryClient.invalidateQueries({ queryKey: ['platform-accounts'] }),
    ]);
    setAvailableSelected(new Set());
    setLinkedSelected(new Set());
  };

  const associateMutation = useMutation({
    mutationFn: () =>
      createPlatformAccountsBulk({
        platformId,
        clientId: associateClientId,
        accounts: selectedAvailableAccounts.map((item) => ({
          externalAccountId: item.accountId,
          name: item.accountName,
        })),
      }),
    onSuccess: async () => {
      setAssociateOpen(false);
      setAssociateClientId('');
      setApiError(null);
      await invalidate();
    },
    onError: (err) => {
      setApiError(getErrorMessage(err, 'Erro ao associar contas.'));
    },
  });

  const unmatchMutation = useMutation({
    mutationFn: (ids: string[]) => deletePlatformAccounts({ ids }),
    onSuccess: async () => {
      setConfirm(null);
      setApiError(null);
      await invalidate();
    },
    onError: (err) => {
      setApiError(getErrorMessage(err, 'Erro ao desvincular contas.'));
      setConfirm(null);
    },
  });

  const isBusy = associateMutation.isPending || unmatchMutation.isPending;

  const confirmCopy = confirm
    ? {
        title: 'Desvincular contas',
        description: `Remover ${confirm.ids.length} associação(ões)? Os mapeamentos filhos dessas contas serão excluídos.`,
      }
    : { title: '', description: '' };

  const isLoading =
    targetsReady && (availableQuery.isLoading || linkedQuery.isLoading);

  return (
    <BridgePageShell
      title="Vinculação de contas"
      description="Selecione a plataforma ETL, revise vínculos existentes e associe contas ainda sem vínculo. Cada conta pertence a exatamente um cliente."
    >
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { md: 'center' } }}
        >
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
                setNameSearch('');
                setApiError(null);
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

          <TextField
            size="small"
            label="Buscar por nome da conta"
            value={nameSearch}
            onChange={(event) => setNameSearch(event.target.value)}
            disabled={!targetsReady}
            sx={{ minWidth: 260, flex: 1 }}
          />
        </Stack>

        {!targetsReady && (
          <Alert severity="info">
            Selecione a plataforma para carregar as contas.
          </Alert>
        )}

        {apiError && <Alert severity="error">{apiError}</Alert>}

        {isLoading && (
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

        {targetsReady && !isLoading && (
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
                <Typography variant="h6">Vinculados</Typography>
                <Button
                  variant="outlined"
                  color="error"
                  disabled={linkedSelected.size === 0 || isBusy}
                  onClick={() =>
                    setConfirm({ type: 'unmatch', ids: [...linkedSelected] })
                  }
                >
                  Desvincular ({linkedSelected.size})
                </Button>
              </Stack>
              <CheckboxDataTable
                rows={linkedItems}
                getRowId={(row) => row.id}
                selectedIds={linkedSelected}
                onToggle={(id) =>
                  setLinkedSelected((prev) => toggleIdInSet(prev, id))
                }
                onToggleAll={(ids) =>
                  setLinkedSelected((prev) => toggleAllInSet(prev, ids))
                }
                columns={[
                  {
                    id: 'platformName',
                    header: 'Plataforma',
                    render: (row) => row.platformName,
                  },
                  {
                    id: 'accountId',
                    header: 'ID da conta',
                    render: (row) => row.externalAccountId,
                  },
                  {
                    id: 'accountName',
                    header: 'Nome da conta',
                    render: (row) => row.name,
                  },
                  {
                    id: 'client',
                    header: 'Cliente',
                    render: (row) => row.clientName,
                  },
                ]}
                emptyMessage="Nenhuma conta vinculada nesta plataforma."
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
                }}
              >
                <Typography variant="h6">Disponíveis (ETL)</Typography>
                <Button
                  variant="contained"
                  disabled={availableSelected.size === 0 || isBusy}
                  onClick={() => {
                    setAssociateClientId('');
                    setAssociateOpen(true);
                  }}
                >
                  Criar associação ({availableSelected.size})
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
                    id: 'platformName',
                    header: 'Plataforma',
                    render: (row) => row.platformName,
                  },
                  {
                    id: 'accountId',
                    header: 'ID da conta',
                    render: (row) => row.accountId,
                  },
                  {
                    id: 'accountName',
                    header: 'Nome da conta',
                    render: (row) => row.accountName,
                  },
                ]}
                emptyMessage="Nenhuma conta ETL disponível (todas já estão vinculadas)."
              />
            </Box>
          </>
        )}
      </Stack>

      <AssociateAccountsDialog
        open={associateOpen}
        accounts={selectedAvailableAccounts.map((item) => ({
          externalAccountId: item.accountId,
          accountName: item.accountName,
        }))}
        clients={clients}
        selectedClientId={associateClientId}
        onSelectedClientIdChange={setAssociateClientId}
        loading={associateMutation.isPending}
        onCancel={() => {
          if (associateMutation.isPending) return;
          setAssociateOpen(false);
          setAssociateClientId('');
        }}
        onConfirm={() => associateMutation.mutate()}
      />

      <BulkConfirmDialog
        open={confirm !== null}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel="Desvincular"
        confirmColor="error"
        loading={unmatchMutation.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          unmatchMutation.mutate(confirm.ids);
        }}
      />
    </BridgePageShell>
  );
}
