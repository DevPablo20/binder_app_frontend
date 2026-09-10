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
import { getBuyingTypes } from '@/api/buying-type';
import { getCampaigns } from '@/api/campaign';
import { getChannel, getChannels } from '@/api/channel';
import { getPlatformAccounts } from '@/api/platform-account';
import {
  createPlatformObjectMapsBulk,
  deletePlatformObjectMaps,
  getPlatformObjectMaps,
} from '@/api/platform-object-map';
import { getPlatforms } from '@/api/platform';
import { BridgePageShell } from '@/pages/Bridge/BridgePageShell';
import { toggleAllInSet, toggleIdInSet } from '@/pages/Bridge/catalogHelpers';
import { AssociateCampaignsDialog } from '@/pages/Bridge/components/AssociateCampaignsDialog';
import { BulkConfirmDialog } from '@/pages/Bridge/components/BulkConfirmDialog';
import { CheckboxDataTable } from '@/pages/Bridge/components/CheckboxDataTable';
import type { CatalogItem, PlatformObjectMapSummary } from '@/types/bridge';
import { getErrorMessage } from '@/utils/errors';

interface LinkedCampaignGroup {
  externalCampaignId: string;
  campaignName: string;
  accountId: string;
  accountName: string;
  platformName: string;
  clients: Array<{ id: string; name: string }>;
  mapIds: string[];
  binderCampaignNames: string[];
  channelNames: string[];
  buyingTypeNames: string[];
}

interface AvailableCampaignRow {
  rowId: string;
  accountId: string;
  accountName: string;
  campaignId: string;
  campaignName: string;
  platformName: string;
}

type ConfirmAction =
  | { type: 'unmatchSingle'; ids: string[] }
  | { type: 'unmatchMulti'; ids: string[]; externalCampaignId: string }
  | null;

type CampaignSortField =
  | 'platformName'
  | 'accountId'
  | 'accountName'
  | 'campaignId'
  | 'campaignName'
  | 'binderCampaign'
  | 'channel'
  | 'buyingType'
  | 'clients';

type SortDirection = 'asc' | 'desc';

function matchesNameSearch(
  campaignName: string,
  accountName: string,
  search: string,
): boolean {
  if (!search.trim()) return true;
  const needle = search.trim().toLowerCase();
  return (
    campaignName.toLowerCase().includes(needle) ||
    accountName.toLowerCase().includes(needle)
  );
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function sortValueForLinked(
  row: LinkedCampaignGroup,
  field: CampaignSortField,
): string {
  switch (field) {
    case 'platformName':
      return row.platformName;
    case 'accountId':
      return row.accountId;
    case 'accountName':
      return row.accountName;
    case 'campaignId':
      return row.externalCampaignId;
    case 'campaignName':
      return row.campaignName;
    case 'binderCampaign':
      return row.binderCampaignNames.join(', ');
    case 'channel':
      return row.channelNames.join(', ');
    case 'buyingType':
      return row.buyingTypeNames.join(', ');
    case 'clients':
      return row.clients.map((client) => client.name).join(', ');
  }
}

function sortValueForAvailable(
  row: AvailableCampaignRow,
  field: CampaignSortField,
): string {
  switch (field) {
    case 'platformName':
      return row.platformName;
    case 'accountId':
      return row.accountId;
    case 'accountName':
      return row.accountName;
    case 'campaignId':
      return row.campaignId;
    case 'campaignName':
      return row.campaignName;
    default:
      return row.campaignName;
  }
}

function compareByField(
  aValue: string,
  bValue: string,
  sortDir: SortDirection,
): number {
  const result = aValue.localeCompare(bValue);
  return sortDir === 'asc' ? result : -result;
}

function toggleSort(
  currentField: CampaignSortField,
  currentDir: SortDirection,
  nextField: string,
): { field: CampaignSortField; dir: SortDirection } {
  const field = nextField as CampaignSortField;
  if (currentField === field) {
    return { field, dir: currentDir === 'asc' ? 'desc' : 'asc' };
  }
  return { field, dir: 'asc' };
}

export function CampaignMatchingPage() {
  const queryClient = useQueryClient();
  const [platformId, setPlatformId] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [linkedSortBy, setLinkedSortBy] =
    useState<CampaignSortField>('accountName');
  const [linkedSortDir, setLinkedSortDir] = useState<SortDirection>('asc');
  const [availableSortBy, setAvailableSortBy] =
    useState<CampaignSortField>('accountName');
  const [availableSortDir, setAvailableSortDir] =
    useState<SortDirection>('asc');
  const [availableSelected, setAvailableSelected] = useState<Set<string>>(
    new Set(),
  );
  const [singleClientSelected, setSingleClientSelected] = useState<Set<string>>(
    new Set(),
  );
  const [multiClientSelected, setMultiClientSelected] = useState<Set<string>>(
    new Set(),
  );
  const [associateOpen, setAssociateOpen] = useState(false);
  const [associateCampaignId, setAssociateCampaignId] = useState('');
  const [associateChannelId, setAssociateChannelId] = useState('');
  const [associateBuyingTypeId, setAssociateBuyingTypeId] = useState('');
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const targetsReady = Boolean(platformId);

  const { data: platforms = [] } = useQuery({
    queryKey: ['platforms'],
    queryFn: getPlatforms,
  });
  const { data: binderCampaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: getCampaigns,
  });
  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: getChannels,
  });
  const { data: buyingTypes = [] } = useQuery({
    queryKey: ['buying-types'],
    queryFn: getBuyingTypes,
  });
  const { data: channelDetail } = useQuery({
    queryKey: ['channels', associateChannelId],
    queryFn: () => getChannel(associateChannelId),
    enabled: Boolean(associateChannelId),
  });

  const selectedPlatform = platforms.find(
    (platform) => platform.id === platformId,
  );

  const accountsQuery = useQuery({
    queryKey: ['platform-accounts', platformId],
    queryFn: () => getPlatformAccounts({ platformId }),
    enabled: targetsReady,
  });

  const catalogQuery = useQuery({
    queryKey: ['bridge-catalog', platformId, 'campaign'],
    queryFn: () =>
      getCatalog(platformId, {
        objectType: 'campaign',
      }),
    enabled: targetsReady,
  });

  const linkedQuery = useQuery({
    queryKey: ['platform-object-maps', platformId, 'campaign'],
    queryFn: () =>
      getPlatformObjectMaps({
        platformId,
        objectType: 'campaign',
      }),
    enabled: targetsReady,
  });

  const linkedGroups = useMemo(() => {
    const rows = linkedQuery.data ?? [];
    const byExternal = new Map<string, LinkedCampaignGroup>();

    for (const row of rows) {
      const existing = byExternal.get(row.externalId);
      if (existing) {
        existing.clients.push({ id: row.clientId, name: row.clientName });
        existing.mapIds.push(row.id);
        existing.binderCampaignNames.push(row.campaignName);
        if (row.channelName) existing.channelNames.push(row.channelName);
        if (row.buyingTypeName) {
          existing.buyingTypeNames.push(row.buyingTypeName);
        }
        continue;
      }
      byExternal.set(row.externalId, {
        externalCampaignId: row.externalId,
        campaignName: row.externalName ?? row.externalId,
        accountId: row.externalAccountId,
        accountName: row.accountName,
        platformName: row.platformName,
        clients: [{ id: row.clientId, name: row.clientName }],
        mapIds: [row.id],
        binderCampaignNames: [row.campaignName],
        channelNames: row.channelName ? [row.channelName] : [],
        buyingTypeNames: row.buyingTypeName ? [row.buyingTypeName] : [],
      });
    }

    return [...byExternal.values()]
      .map((group) => {
        const uniqueClients = new Map(
          group.clients.map((client) => [client.id, client]),
        );
        return {
          ...group,
          clients: [...uniqueClients.values()],
          binderCampaignNames: uniqueSorted(group.binderCampaignNames),
          channelNames: uniqueSorted(group.channelNames),
          buyingTypeNames: uniqueSorted(group.buyingTypeNames),
        };
      });
  }, [linkedQuery.data]);

  const singleClientGroups = useMemo(
    () =>
      linkedGroups
        .filter(
          (group) =>
            group.clients.length === 1 &&
            matchesNameSearch(
              group.campaignName,
              group.accountName,
              nameSearch,
            ),
        )
        .sort((a, b) =>
          compareByField(
            sortValueForLinked(a, linkedSortBy),
            sortValueForLinked(b, linkedSortBy),
            linkedSortDir,
          ),
        ),
    [linkedGroups, nameSearch, linkedSortBy, linkedSortDir],
  );

  const multiClientGroups = useMemo(
    () =>
      linkedGroups
        .filter(
          (group) =>
            group.clients.length > 1 &&
            matchesNameSearch(
              group.campaignName,
              group.accountName,
              nameSearch,
            ),
        )
        .sort((a, b) =>
          compareByField(
            sortValueForLinked(a, linkedSortBy),
            sortValueForLinked(b, linkedSortBy),
            linkedSortDir,
          ),
        ),
    [linkedGroups, nameSearch, linkedSortBy, linkedSortDir],
  );

  const availableItems = useMemo(() => {
    const accounts = accountsQuery.data ?? [];
    const catalog = catalogQuery.data ?? [];
    const maps = linkedQuery.data ?? [];
    const platformName = selectedPlatform?.name ?? '';

    const accountsByExternal = new Map<string, typeof accounts>();
    for (const account of accounts) {
      const list = accountsByExternal.get(account.externalAccountId) ?? [];
      list.push(account);
      accountsByExternal.set(account.externalAccountId, list);
    }

    const mappedKeys = new Set(
      maps.map(
        (map: PlatformObjectMapSummary) =>
          `${map.platformAccountId}:${map.externalId}`,
      ),
    );

    const rows: AvailableCampaignRow[] = [];
    for (const item of catalog as CatalogItem[]) {
      const externalCampaignId = item.campaignId;
      if (!externalCampaignId) continue;

      const parentAccounts = accountsByExternal.get(item.accountId);
      if (!parentAccounts || parentAccounts.length === 0) continue;

      const hasOpenSlot = parentAccounts.some(
        (account) => !mappedKeys.has(`${account.id}:${externalCampaignId}`),
      );
      if (!hasOpenSlot) continue;

      rows.push({
        rowId: `${item.accountId}:${externalCampaignId}`,
        accountId: item.accountId,
        accountName: item.accountName,
        campaignId: externalCampaignId,
        campaignName: item.campaignName ?? externalCampaignId,
        platformName: platformName || item.platform,
      });
    }

    return rows
      .filter((row) =>
        matchesNameSearch(row.campaignName, row.accountName, nameSearch),
      )
      .sort((a, b) =>
        compareByField(
          sortValueForAvailable(a, availableSortBy),
          sortValueForAvailable(b, availableSortBy),
          availableSortDir,
        ),
      );
  }, [
    accountsQuery.data,
    catalogQuery.data,
    linkedQuery.data,
    nameSearch,
    availableSortBy,
    availableSortDir,
    selectedPlatform?.name,
  ]);

  const selectedAvailableRows = useMemo(
    () => availableItems.filter((row) => availableSelected.has(row.rowId)),
    [availableItems, availableSelected],
  );

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['bridge-catalog'] }),
      queryClient.invalidateQueries({ queryKey: ['platform-object-maps'] }),
      queryClient.invalidateQueries({ queryKey: ['platform-accounts'] }),
    ]);
    setAvailableSelected(new Set());
    setSingleClientSelected(new Set());
    setMultiClientSelected(new Set());
  };

  const associateMutation = useMutation({
    mutationFn: async () => {
      const binderCampaign = binderCampaigns.find(
        (campaign) => campaign.id === associateCampaignId,
      );
      if (!binderCampaign) {
        throw new Error('Campanha Binder não encontrada');
      }

      const accounts = accountsQuery.data ?? [];
      const items = selectedAvailableRows.map((row) => {
        const platformAccount = accounts.find(
          (account) =>
            account.externalAccountId === row.accountId &&
            account.clientId === binderCampaign.clientId,
        );
        if (!platformAccount) {
          throw new Error(
            `Conta ETL ${row.accountId} não está associada ao cliente da campanha Binder selecionada`,
          );
        }
        return {
          platformAccountId: platformAccount.id,
          externalId: row.campaignId,
          externalName: row.campaignName,
        };
      });

      return createPlatformObjectMapsBulk({
        objectType: 'campaign',
        campaignId: associateCampaignId,
        channelId: associateChannelId,
        buyingTypeId: associateBuyingTypeId,
        items,
      });
    },
    onSuccess: async () => {
      setAssociateOpen(false);
      setAssociateCampaignId('');
      setAssociateChannelId('');
      setAssociateBuyingTypeId('');
      setApiError(null);
      await invalidate();
    },
    onError: (err) => {
      setApiError(getErrorMessage(err, 'Erro ao associar campanhas.'));
    },
  });

  const unmatchMutation = useMutation({
    mutationFn: (ids: string[]) => deletePlatformObjectMaps({ ids }),
    onSuccess: async () => {
      setConfirm(null);
      setApiError(null);
      await invalidate();
    },
    onError: (err) => {
      setApiError(getErrorMessage(err, 'Erro ao desvincular campanhas.'));
      setConfirm(null);
    },
  });

  const isBusy = associateMutation.isPending || unmatchMutation.isPending;

  const handleLinkedSort = (columnId: string) => {
    const next = toggleSort(linkedSortBy, linkedSortDir, columnId);
    setLinkedSortBy(next.field);
    setLinkedSortDir(next.dir);
  };

  const handleAvailableSort = (columnId: string) => {
    const next = toggleSort(availableSortBy, availableSortDir, columnId);
    setAvailableSortBy(next.field);
    setAvailableSortDir(next.dir);
  };

  const linkedColumns = [
    {
      id: 'platformName',
      header: 'Plataforma',
      sortable: true,
      render: (row: LinkedCampaignGroup) => row.platformName,
    },
    {
      id: 'accountId',
      header: 'ID da conta',
      sortable: true,
      render: (row: LinkedCampaignGroup) => row.accountId,
    },
    {
      id: 'accountName',
      header: 'Nome da conta',
      sortable: true,
      render: (row: LinkedCampaignGroup) => row.accountName,
    },
    {
      id: 'campaignId',
      header: 'ID da campanha',
      sortable: true,
      render: (row: LinkedCampaignGroup) => row.externalCampaignId,
    },
    {
      id: 'campaignName',
      header: 'Nome da campanha',
      sortable: true,
      render: (row: LinkedCampaignGroup) => row.campaignName,
    },
    {
      id: 'binderCampaign',
      header: 'Campanha Binder',
      sortable: true,
      render: (row: LinkedCampaignGroup) => row.binderCampaignNames.join(', '),
    },
    {
      id: 'channel',
      header: 'Canal',
      sortable: true,
      render: (row: LinkedCampaignGroup) =>
        row.channelNames.join(', ') || '—',
    },
    {
      id: 'buyingType',
      header: 'Tipo de compra',
      sortable: true,
      render: (row: LinkedCampaignGroup) =>
        row.buyingTypeNames.join(', ') || '—',
    },
    {
      id: 'clients',
      header: 'Clientes',
      sortable: true,
      render: (row: LinkedCampaignGroup) =>
        row.clients.map((client) => client.name).join(', '),
    },
  ];

  const availableColumns = [
    {
      id: 'platformName',
      header: 'Plataforma',
      sortable: true,
      render: (row: AvailableCampaignRow) => row.platformName,
    },
    {
      id: 'accountId',
      header: 'ID da conta',
      sortable: true,
      render: (row: AvailableCampaignRow) => row.accountId,
    },
    {
      id: 'accountName',
      header: 'Nome da conta',
      sortable: true,
      render: (row: AvailableCampaignRow) => row.accountName,
    },
    {
      id: 'campaignId',
      header: 'ID da campanha',
      sortable: true,
      render: (row: AvailableCampaignRow) => row.campaignId,
    },
    {
      id: 'campaignName',
      header: 'Nome da campanha',
      sortable: true,
      render: (row: AvailableCampaignRow) => row.campaignName,
    },
  ];

  const confirmCopy = (() => {
    if (!confirm) return { title: '', description: '' };
    if (confirm.type === 'unmatchSingle') {
      return {
        title: 'Desvincular campanhas',
        description: `Remover ${confirm.ids.length} associação(ões)?`,
      };
    }
    return {
      title: 'Desvincular todos os clientes',
      description: `Remover todas as associações da campanha ETL ${confirm.externalCampaignId} nesta plataforma?`,
    };
  })();

  const isLoading =
    targetsReady &&
    (accountsQuery.isLoading ||
      catalogQuery.isLoading ||
      linkedQuery.isLoading);

  return (
    <BridgePageShell
      title="Vinculação de campanhas"
      description="Selecione a plataforma ETL, revise vínculos existentes e associe campanhas de contas já vinculadas a uma campanha Binder com canal e tipo de compra."
    >
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { md: 'center' } }}
        >
          <FormControl sx={{ minWidth: 220 }} size="small">
            <InputLabel id="campaign-platform-label">Plataforma</InputLabel>
            <Select
              labelId="campaign-platform-label"
              label="Plataforma"
              value={platformId}
              onChange={(event) => {
                setPlatformId(event.target.value);
                setAvailableSelected(new Set());
                setSingleClientSelected(new Set());
                setMultiClientSelected(new Set());
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
            label="Buscar por nome da campanha ou conta"
            value={nameSearch}
            onChange={(event) => setNameSearch(event.target.value)}
            disabled={!targetsReady}
            sx={{ minWidth: 280, flex: 1 }}
          />
        </Stack>

        {!targetsReady && (
          <Alert severity="info">
            Selecione a plataforma para carregar as campanhas.
          </Alert>
        )}

        {apiError && <Alert severity="error">{apiError}</Alert>}

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {targetsReady &&
          (accountsQuery.isError ||
            catalogQuery.isError ||
            linkedQuery.isError) && (
            <Alert severity="error">
              {getErrorMessage(
                accountsQuery.error ??
                  catalogQuery.error ??
                  linkedQuery.error,
                'Erro ao carregar campanhas.',
              )}
            </Alert>
          )}

        {targetsReady && !isLoading && (
          <>
            <Box>
              <Typography variant="h6" gutterBottom>
                Vinculados
              </Typography>

              <Stack spacing={3}>
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
                    <Typography variant="subtitle1">
                      Um cliente apenas
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      disabled={singleClientSelected.size === 0 || isBusy}
                      onClick={() => {
                        const ids = singleClientGroups
                          .filter((group) =>
                            singleClientSelected.has(group.externalCampaignId),
                          )
                          .flatMap((group) => group.mapIds);
                        setConfirm({ type: 'unmatchSingle', ids });
                      }}
                    >
                      Desvincular ({singleClientSelected.size})
                    </Button>
                  </Stack>
                  <CheckboxDataTable
                    rows={singleClientGroups}
                    getRowId={(row) => row.externalCampaignId}
                    selectedIds={singleClientSelected}
                    onToggle={(id) =>
                      setSingleClientSelected((prev) => toggleIdInSet(prev, id))
                    }
                    onToggleAll={(ids) =>
                      setSingleClientSelected((prev) =>
                        toggleAllInSet(prev, ids),
                      )
                    }
                    columns={linkedColumns}
                    sortBy={linkedSortBy}
                    sortDirection={linkedSortDir}
                    onSortChange={handleLinkedSort}
                    emptyMessage="Nenhuma campanha vinculada a exatamente um cliente."
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
                    <Typography variant="subtitle1">
                      Dois ou mais clientes
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      disabled={multiClientSelected.size !== 1 || isBusy}
                      onClick={() => {
                        const externalCampaignId = [...multiClientSelected][0];
                        const group = multiClientGroups.find(
                          (item) =>
                            item.externalCampaignId === externalCampaignId,
                        );
                        if (!group) return;
                        setConfirm({
                          type: 'unmatchMulti',
                          ids: group.mapIds,
                          externalCampaignId: group.externalCampaignId,
                        });
                      }}
                    >
                      Desvincular todos os clientes
                    </Button>
                  </Stack>
                  <CheckboxDataTable
                    selectionMode="single"
                    rows={multiClientGroups}
                    getRowId={(row) => row.externalCampaignId}
                    selectedIds={multiClientSelected}
                    onToggle={(id) =>
                      setMultiClientSelected((prev) => {
                        if (prev.has(id)) return new Set();
                        return new Set([id]);
                      })
                    }
                    onToggleAll={() => undefined}
                    columns={linkedColumns}
                    sortBy={linkedSortBy}
                    sortDirection={linkedSortDir}
                    onSortChange={handleLinkedSort}
                    emptyMessage="Nenhuma campanha vinculada a mais de um cliente."
                  />
                </Box>
              </Stack>
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
                    setAssociateCampaignId('');
                    setAssociateChannelId('');
                    setAssociateBuyingTypeId('');
                    setAssociateOpen(true);
                  }}
                >
                  Criar associação ({availableSelected.size})
                </Button>
              </Stack>
              <CheckboxDataTable
                rows={availableItems}
                getRowId={(row) => row.rowId}
                selectedIds={availableSelected}
                onToggle={(id) =>
                  setAvailableSelected((prev) => toggleIdInSet(prev, id))
                }
                onToggleAll={(ids) =>
                  setAvailableSelected((prev) => toggleAllInSet(prev, ids))
                }
                columns={availableColumns}
                sortBy={availableSortBy}
                sortDirection={availableSortDir}
                onSortChange={handleAvailableSort}
                emptyMessage="Nenhuma campanha ETL disponível sob contas já associadas."
              />
            </Box>
          </>
        )}
      </Stack>

      <AssociateCampaignsDialog
        open={associateOpen}
        items={selectedAvailableRows.map((row) => ({
          externalAccountId: row.accountId,
          accountName: row.accountName,
          externalCampaignId: row.campaignId,
          campaignName: row.campaignName,
        }))}
        campaigns={binderCampaigns}
        channels={channels}
        channelDetail={channelDetail}
        buyingTypes={buyingTypes}
        platformId={platformId}
        selectedCampaignId={associateCampaignId}
        selectedChannelId={associateChannelId}
        selectedBuyingTypeId={associateBuyingTypeId}
        onSelectedCampaignIdChange={setAssociateCampaignId}
        onSelectedChannelIdChange={setAssociateChannelId}
        onSelectedBuyingTypeIdChange={setAssociateBuyingTypeId}
        loading={associateMutation.isPending}
        onCancel={() => {
          if (associateMutation.isPending) return;
          setAssociateOpen(false);
          setAssociateCampaignId('');
          setAssociateChannelId('');
          setAssociateBuyingTypeId('');
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
