import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { getCatalog } from '@/api/bridge-catalog';
import { getBuyingTypes } from '@/api/buying-type';
import { getCampaigns } from '@/api/campaign';
import { getChannel, getChannels } from '@/api/channel';
import { getClients } from '@/api/client-api';
import { getGroupings } from '@/api/grouping';
import { getPlatforms } from '@/api/platform';
import { getPlatformAccounts } from '@/api/platform-account';
import {
  createPlatformObjectMap,
  deletePlatformObjectMaps,
  getPlatformObjectMaps,
  updatePlatformObjectMaps,
} from '@/api/platform-object-map';
import { getSubGroupings } from '@/api/sub-grouping';
import { BridgePageShell } from '@/pages/Bridge/BridgePageShell';
import {
  catalogExternalId,
  catalogExternalName,
  toggleAllInSet,
  toggleIdInSet,
} from '@/pages/Bridge/catalogHelpers';
import { BulkConfirmDialog } from '@/pages/Bridge/components/BulkConfirmDialog';
import { CheckboxDataTable } from '@/pages/Bridge/components/CheckboxDataTable';
import type {
  CatalogItem,
  PlatformObjectMapSummary,
  PlatformObjectType,
} from '@/types/bridge';
import { getErrorMessage } from '@/utils/errors';

type ConfirmAction = 'associate' | 'remove' | 'editEnrichment' | null;

const TITLES: Record<
  PlatformObjectType,
  { title: string; description: string; availableLabel: string }
> = {
  campaign: {
    title: 'Vinculação de campanhas',
    description:
      'Selecione cliente, plataforma, campanha Binder, canal e tipo de compra. Depois associe campanhas ETL em lote.',
    availableLabel: 'Campanhas ETL disponíveis',
  },
  ad_group: {
    title: 'Vinculação de ad groups',
    description:
      'Selecione cliente, plataforma e campanha Binder. Só aparecem ad groups cujas campanhas ETL já foram vinculadas a essa campanha Binder.',
    availableLabel: 'Ad groups ETL disponíveis',
  },
  ad: {
    title: 'Vinculação de anúncios',
    description:
      'Selecione cliente, plataforma e campanha Binder. Só aparecem anúncios cujos ad groups ETL já foram vinculados a essa campanha Binder.',
    availableLabel: 'Anúncios ETL disponíveis',
  },
};

interface ObjectMatchingPageProps {
  objectType: PlatformObjectType;
}

export function ObjectMatchingPage({ objectType }: ObjectMatchingPageProps) {
  const queryClient = useQueryClient();
  const copy = TITLES[objectType];

  const [clientId, setClientId] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [buyingTypeId, setBuyingTypeId] = useState('');
  const [subGroupingIds, setSubGroupingIds] = useState<string[]>([]);
  const [availableSelected, setAvailableSelected] = useState<Set<string>>(
    new Set(),
  );
  const [linkedSelected, setLinkedSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const baseReady = Boolean(clientId && platformId && campaignId);
  const targetsReady =
    objectType === 'campaign'
      ? baseReady && Boolean(channelId && buyingTypeId)
      : baseReady;

  const { data: platforms = [] } = useQuery({
    queryKey: ['platforms'],
    queryFn: getPlatforms,
  });
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: getCampaigns,
  });
  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: getChannels,
    enabled: objectType === 'campaign',
  });
  const { data: buyingTypes = [] } = useQuery({
    queryKey: ['buying-types'],
    queryFn: getBuyingTypes,
    enabled: objectType === 'campaign',
  });
  const { data: channelDetail } = useQuery({
    queryKey: ['channels', channelId],
    queryFn: () => getChannel(channelId),
    enabled: objectType === 'campaign' && Boolean(channelId),
  });
  const { data: groupings = [] } = useQuery({
    queryKey: ['groupings'],
    queryFn: getGroupings,
    enabled: objectType === 'ad_group',
  });
  const { data: subGroupings = [] } = useQuery({
    queryKey: ['sub-groupings'],
    queryFn: getSubGroupings,
    enabled: objectType === 'ad_group',
  });

  const clientCampaigns = useMemo(
    () =>
      campaigns.filter(
        (campaign) => campaign.isActive && campaign.clientId === clientId,
      ),
    [campaigns, clientId],
  );

  const platformChannels = useMemo(
    () =>
      channels.filter(
        (channel) => channel.isActive && channel.platformId === platformId,
      ),
    [channels, platformId],
  );

  const allowedBuyingTypes = useMemo(() => {
    const allowed = new Set(channelDetail?.buyingTypeIds ?? []);
    return buyingTypes.filter(
      (buyingType) => buyingType.isActive && allowed.has(buyingType.id),
    );
  }, [buyingTypes, channelDetail]);

  const campaignSubGroupings = useMemo(() => {
    const groupingIds = new Set(
      groupings
        .filter(
          (grouping) =>
            grouping.isActive && grouping.campaignId === campaignId,
        )
        .map((grouping) => grouping.id),
    );
    return subGroupings.filter(
      (sub) => sub.isActive && groupingIds.has(sub.groupingId),
    );
  }, [groupings, subGroupings, campaignId]);

  const groupingNameById = useMemo(
    () => new Map(groupings.map((grouping) => [grouping.id, grouping.name])),
    [groupings],
  );

  const availableQuery = useQuery({
    queryKey: [
      'bridge-catalog',
      platformId,
      objectType,
      true,
      clientId,
    ],
    queryFn: () =>
      getCatalog(platformId, {
        objectType,
        unmatchedOnly: true,
        clientId,
      }),
    enabled: targetsReady,
  });

  const linkedQuery = useQuery({
    queryKey: ['platform-object-maps', campaignId, objectType],
    queryFn: () => getPlatformObjectMaps({ campaignId, objectType }),
    enabled: targetsReady,
  });

  // Parent maps: ad_groups require mapped ETL campaigns; ads require mapped ETL ad_groups
  const parentObjectType: PlatformObjectType | null =
    objectType === 'ad_group'
      ? 'campaign'
      : objectType === 'ad'
        ? 'ad_group'
        : null;

  const parentMapsQuery = useQuery({
    queryKey: ['platform-object-maps', campaignId, parentObjectType],
    queryFn: () =>
      getPlatformObjectMaps({
        campaignId,
        objectType: parentObjectType!,
      }),
    enabled: targetsReady && parentObjectType !== null,
  });

  const accountsQuery = useQuery({
    queryKey: ['platform-accounts', clientId, platformId],
    queryFn: () => getPlatformAccounts({ clientId, platformId }),
    enabled: targetsReady,
  });

  const accountIds = useMemo(
    () => new Set((accountsQuery.data ?? []).map((account) => account.id)),
    [accountsQuery.data],
  );

  const allowedParentKeys = useMemo(() => {
    if (!parentObjectType) return null;
    const keys = new Set<string>();
    for (const map of parentMapsQuery.data ?? []) {
      if (!accountIds.has(map.platformAccountId)) continue;
      keys.add(`${map.platformAccountId}:${map.externalId}`);
    }
    return keys;
  }, [parentObjectType, parentMapsQuery.data, accountIds]);

  const availableItems = useMemo(() => {
    const items = availableQuery.data ?? [];
    if (!allowedParentKeys) return items;

    return items.filter((item) => {
      if (!item.platformAccountId) return false;
      const parentExternalId =
        objectType === 'ad_group' ? item.campaignId : item.adGroupId;
      if (!parentExternalId) return false;
      return allowedParentKeys.has(
        `${item.platformAccountId}:${parentExternalId}`,
      );
    });
  }, [availableQuery.data, allowedParentKeys, objectType]);

  const linkedMaps = useMemo(
    () =>
      (linkedQuery.data ?? []).filter((map) =>
        accountIds.has(map.platformAccountId),
      ),
    [linkedQuery.data, accountIds],
  );

  const availableByKey = useMemo(() => {
    const map = new Map<string, CatalogItem>();
    for (const item of availableItems) {
      const externalId = catalogExternalId(item, objectType);
      if (externalId && item.platformAccountId) {
        map.set(`${item.platformAccountId}:${externalId}`, item);
      }
    }
    return map;
  }, [availableItems, objectType]);

  const resetSelections = () => {
    setAvailableSelected(new Set());
    setLinkedSelected(new Set());
  };

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['bridge-catalog'] }),
      queryClient.invalidateQueries({ queryKey: ['platform-object-maps'] }),
    ]);
    resetSelections();
  };

  const associateMutation = useMutation({
    mutationFn: async () => {
      const keys = [...availableSelected];
      await Promise.all(
        keys.map((key) => {
          const item = availableByKey.get(key);
          if (!item?.platformAccountId) {
            throw new Error('Item ETL inválido na seleção');
          }
          const externalId = catalogExternalId(item, objectType);
          return createPlatformObjectMap({
            platformAccountId: item.platformAccountId,
            objectType,
            externalId,
            externalName: catalogExternalName(item, objectType),
            campaignId,
            ...(objectType === 'campaign'
              ? { channelId, buyingTypeId }
              : {}),
            ...(objectType === 'ad_group' && subGroupingIds.length > 0
              ? { subGroupingIds }
              : {}),
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
      setApiError(getErrorMessage(err, 'Erro ao associar objetos.'));
      setConfirm(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => deletePlatformObjectMaps({ ids: [...linkedSelected] }),
    onSuccess: async () => {
      setConfirm(null);
      setApiError(null);
      await invalidate();
    },
    onError: (err) => {
      setApiError(getErrorMessage(err, 'Erro ao remover mapeamentos.'));
      setConfirm(null);
    },
  });

  const editMutation = useMutation({
    mutationFn: () =>
      updatePlatformObjectMaps({
        platformObjectMaps: [...linkedSelected].map((id) => ({
          id,
          ...(objectType === 'campaign'
            ? { channelId, buyingTypeId }
            : {}),
          ...(objectType === 'ad_group' ? { subGroupingIds } : {}),
        })),
      }),
    onSuccess: async () => {
      setConfirm(null);
      setApiError(null);
      await invalidate();
    },
    onError: (err) => {
      setApiError(getErrorMessage(err, 'Erro ao atualizar enriquecimento.'));
      setConfirm(null);
    },
  });

  const isBusy =
    associateMutation.isPending ||
    removeMutation.isPending ||
    editMutation.isPending;

  const handleConfirm = () => {
    if (confirm === 'associate') associateMutation.mutate();
    if (confirm === 'remove') removeMutation.mutate();
    if (confirm === 'editEnrichment') editMutation.mutate();
  };

  const confirmCopy = (() => {
    if (confirm === 'associate') {
      return {
        title: 'Associar selecionados',
        description: `Associar ${availableSelected.size} item(ns) ETL à campanha Binder selecionada?`,
        confirmLabel: 'Associar',
        confirmColor: 'primary' as const,
      };
    }
    if (confirm === 'remove') {
      return {
        title: 'Remover mapeamentos',
        description: `Remover permanentemente ${linkedSelected.size} mapeamento(s)?`,
        confirmLabel: 'Remover',
        confirmColor: 'error' as const,
      };
    }
    if (confirm === 'editEnrichment') {
      return {
        title: 'Atualizar enriquecimento',
        description: `Aplicar canal/tipo de compra ou subagrupamentos atuais a ${linkedSelected.size} mapeamento(s) vinculados?`,
        confirmLabel: 'Atualizar',
        confirmColor: 'primary' as const,
      };
    }
    return {
      title: '',
      description: '',
      confirmLabel: 'Confirmar',
      confirmColor: 'primary' as const,
    };
  })();

  const showEditEnrichment =
    objectType === 'campaign' || objectType === 'ad_group';

  return (
    <BridgePageShell title={copy.title} description={copy.description}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { md: 'center' }, flexWrap: 'wrap' }}
        >
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel id={`${objectType}-client-label`}>Cliente</InputLabel>
            <Select
              labelId={`${objectType}-client-label`}
              label="Cliente"
              value={clientId}
              onChange={(event) => {
                setClientId(event.target.value);
                setCampaignId('');
                resetSelections();
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

          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel id={`${objectType}-platform-label`}>
              Plataforma
            </InputLabel>
            <Select
              labelId={`${objectType}-platform-label`}
              label="Plataforma"
              value={platformId}
              onChange={(event) => {
                setPlatformId(event.target.value);
                setChannelId('');
                setBuyingTypeId('');
                resetSelections();
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

          <FormControl sx={{ minWidth: 220 }} size="small" disabled={!clientId}>
            <InputLabel id={`${objectType}-campaign-label`}>
              Campanha Binder
            </InputLabel>
            <Select
              labelId={`${objectType}-campaign-label`}
              label="Campanha Binder"
              value={campaignId}
              onChange={(event) => {
                setCampaignId(event.target.value);
                setSubGroupingIds([]);
                resetSelections();
              }}
            >
              {clientCampaigns.map((campaign) => (
                <MenuItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {objectType === 'campaign' && (
            <>
              <FormControl
                sx={{ minWidth: 180 }}
                size="small"
                disabled={!platformId}
              >
                <InputLabel id={`${objectType}-channel-label`}>Canal</InputLabel>
                <Select
                  labelId={`${objectType}-channel-label`}
                  label="Canal"
                  value={channelId}
                  onChange={(event) => {
                    setChannelId(event.target.value);
                    setBuyingTypeId('');
                  }}
                >
                  {platformChannels.map((channel) => (
                    <MenuItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl
                sx={{ minWidth: 180 }}
                size="small"
                disabled={!channelId}
              >
                <InputLabel id={`${objectType}-buying-label`}>
                  Tipo de compra
                </InputLabel>
                <Select
                  labelId={`${objectType}-buying-label`}
                  label="Tipo de compra"
                  value={buyingTypeId}
                  onChange={(event) => setBuyingTypeId(event.target.value)}
                >
                  {allowedBuyingTypes.map((buyingType) => (
                    <MenuItem key={buyingType.id} value={buyingType.id}>
                      {buyingType.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}

          {objectType === 'ad_group' && (
            <FormControl
              sx={{ minWidth: 260 }}
              size="small"
              disabled={!campaignId}
            >
              <InputLabel id={`${objectType}-subgroupings-label`}>
                Subagrupamentos (opcional)
              </InputLabel>
              <Select
                multiple
                labelId={`${objectType}-subgroupings-label`}
                value={subGroupingIds}
                onChange={(event) =>
                  setSubGroupingIds(
                    typeof event.target.value === 'string'
                      ? event.target.value.split(',')
                      : event.target.value,
                  )
                }
                input={<OutlinedInput label="Subagrupamentos (opcional)" />}
                renderValue={(selected) =>
                  selected
                    .map((id) => {
                      const sub = campaignSubGroupings.find(
                        (item) => item.id === id,
                      );
                      if (!sub) return id;
                      const groupingName =
                        groupingNameById.get(sub.groupingId) ?? '';
                      return groupingName
                        ? `${groupingName} / ${sub.name}`
                        : sub.name;
                    })
                    .join(', ')
                }
              >
                {campaignSubGroupings.map((sub) => (
                  <MenuItem key={sub.id} value={sub.id}>
                    <Checkbox checked={subGroupingIds.includes(sub.id)} />
                    <ListItemText
                      primary={sub.name}
                      secondary={
                        groupingNameById.get(sub.groupingId) ?? undefined
                      }
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>

        {!targetsReady && (
          <Alert severity="info">
            {objectType === 'campaign'
              ? 'Selecione cliente, plataforma, campanha Binder, canal e tipo de compra.'
              : 'Selecione cliente, plataforma e campanha Binder.'}
          </Alert>
        )}

        {apiError && <Alert severity="error">{apiError}</Alert>}

        {targetsReady &&
          (availableQuery.isLoading ||
            linkedQuery.isLoading ||
            accountsQuery.isLoading ||
            (parentObjectType !== null && parentMapsQuery.isLoading)) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {targetsReady && availableQuery.isError && (
          <Alert severity="error">
            {getErrorMessage(
              availableQuery.error,
              'Erro ao carregar itens disponíveis.',
            )}
          </Alert>
        )}

        {targetsReady && linkedQuery.isError && (
          <Alert severity="error">
            {getErrorMessage(
              linkedQuery.error,
              'Erro ao carregar itens vinculados.',
            )}
          </Alert>
        )}

        {targetsReady &&
          !availableQuery.isLoading &&
          !linkedQuery.isLoading &&
          !accountsQuery.isLoading &&
          !(parentObjectType !== null && parentMapsQuery.isLoading) && (
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
                  <Typography variant="h6">{copy.availableLabel}</Typography>
                  <Button
                    variant="contained"
                    disabled={availableSelected.size === 0 || isBusy}
                    onClick={() => setConfirm('associate')}
                  >
                    Associar selecionados ({availableSelected.size})
                  </Button>
                </Stack>
                <CheckboxDataTable
                  rows={availableItems}
                  getRowId={(row) => {
                    const externalId = catalogExternalId(row, objectType);
                    return `${row.platformAccountId ?? 'none'}:${externalId}`;
                  }}
                  selectedIds={availableSelected}
                  onToggle={(id) =>
                    setAvailableSelected((prev) => toggleIdInSet(prev, id))
                  }
                  onToggleAll={(ids) =>
                    setAvailableSelected((prev) => toggleAllInSet(prev, ids))
                  }
                  isRowDisabled={(row) => !row.platformAccountId}
                  columns={[
                    {
                      id: 'externalId',
                      header: 'ID externo',
                      render: (row) => catalogExternalId(row, objectType),
                    },
                    {
                      id: 'name',
                      header: 'Nome',
                      render: (row) =>
                        catalogExternalName(row, objectType) ?? '—',
                    },
                    {
                      id: 'account',
                      header: 'Conta',
                      render: (row) => row.accountName,
                    },
                    ...(objectType !== 'campaign'
                      ? [
                          {
                            id: 'parent',
                            header:
                              objectType === 'ad_group'
                                ? 'Campanha ETL'
                                : 'Ad group',
                            render: (row: CatalogItem) =>
                              objectType === 'ad_group'
                                ? (row.campaignName ?? '—')
                                : (row.adGroupName ?? '—'),
                          },
                        ]
                      : []),
                    {
                      id: 'ready',
                      header: 'Conta vinculada',
                      render: (row) =>
                        row.platformAccountId ? 'Sim' : 'Não — vincule a conta',
                    },
                  ]}
                  emptyMessage={
                    objectType === 'ad_group'
                      ? 'Nenhum ad group disponível. Vincule primeiro as campanhas ETL desta campanha Binder.'
                      : objectType === 'ad'
                        ? 'Nenhum anúncio disponível. Vincule primeiro os ad groups ETL desta campanha Binder.'
                        : 'Nenhum item ETL disponível para estes filtros.'
                  }
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
                    Vinculados a esta campanha Binder
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {showEditEnrichment && (
                      <Button
                        variant="outlined"
                        disabled={linkedSelected.size === 0 || isBusy}
                        onClick={() => setConfirm('editEnrichment')}
                      >
                        Atualizar enriquecimento
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="error"
                      disabled={linkedSelected.size === 0 || isBusy}
                      onClick={() => setConfirm('remove')}
                    >
                      Remover ({linkedSelected.size})
                    </Button>
                  </Stack>
                </Stack>
                <CheckboxDataTable
                  rows={linkedMaps}
                  getRowId={(row: PlatformObjectMapSummary) => row.id}
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
                      render: (row) => row.externalId,
                    },
                    {
                      id: 'name',
                      header: 'Nome',
                      render: (row) => row.externalName ?? '—',
                    },
                    ...(objectType === 'campaign'
                      ? [
                          {
                            id: 'channel',
                            header: 'Canal',
                            render: (row: PlatformObjectMapSummary) =>
                              row.channelId ?? '—',
                          },
                          {
                            id: 'buying',
                            header: 'Tipo de compra',
                            render: (row: PlatformObjectMapSummary) =>
                              row.buyingTypeId ?? '—',
                          },
                        ]
                      : []),
                    ...(objectType === 'ad_group'
                      ? [
                          {
                            id: 'subGroupings',
                            header: 'Subagrupamentos',
                            render: (row: PlatformObjectMapSummary) =>
                              row.subGroupingIds.length > 0
                                ? String(row.subGroupingIds.length)
                                : '—',
                          },
                        ]
                      : []),
                  ]}
                  emptyMessage="Nenhum mapeamento vinculado a esta campanha Binder."
                />
              </Box>
            </>
          )}
      </Stack>

      <BulkConfirmDialog
        open={confirm !== null}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        confirmColor={confirmCopy.confirmColor}
        loading={isBusy}
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
      />
    </BridgePageShell>
  );
}
