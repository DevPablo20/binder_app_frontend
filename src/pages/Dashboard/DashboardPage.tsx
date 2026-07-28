import {
  Alert,
  Box,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { getAnalyticsMetrics } from '@/api/analytics';
import { getBuyingTypes } from '@/api/buying-type';
import { getCampaigns } from '@/api/campaign';
import { getChannel, getChannels } from '@/api/channel';
import { getClients } from '@/api/client-api';
import { getGroupings } from '@/api/grouping';
import { getPlatforms } from '@/api/platform';
import { getSubGroupings } from '@/api/sub-grouping';
import { useAuth } from '@/auth/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { AnalyticsGroupBy, MetricBlock } from '@/types/analytics';
import { getErrorMessage } from '@/utils/errors';

const GROUP_BY_OPTIONS: { value: AnalyticsGroupBy; label: string }[] = [
  { value: 'company', label: 'Empresa' },
  { value: 'client', label: 'Cliente' },
  { value: 'campaign', label: 'Campanha' },
  { value: 'platform', label: 'Plataforma' },
  { value: 'channel', label: 'Canal' },
  { value: 'buying_type', label: 'Tipo de compra' },
  { value: 'sub_grouping', label: 'Sub-agrupamento' },
  { value: 'date', label: 'Data' },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${(value * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function resolveAutoGroupBy(filters: {
  companyId: string;
  clientId: string;
  campaignId: string;
  platformId: string;
  channelId: string;
  buyingTypeId: string;
  subGroupingId: string;
}): AnalyticsGroupBy {
  if (filters.subGroupingId) return 'date';
  if (filters.buyingTypeId) return 'sub_grouping';
  if (filters.channelId) return 'buying_type';
  if (filters.platformId) return 'channel';
  if (filters.campaignId) return 'platform';
  if (filters.clientId) return 'campaign';
  if (filters.companyId) return 'client';
  return 'company';
}

function SeriesChart({ series }: { series: MetricBlock[] }) {
  const width = 800;
  const height = 240;
  const pad = { top: 16, right: 16, bottom: 32, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const maxVal = useMemo(() => {
    let max = 0;
    for (const point of series) {
      max = Math.max(max, point.impressions, point.cost, point.clicks);
    }
    return max || 1;
  }, [series]);

  const pathFor = (key: 'impressions' | 'cost' | 'clicks') => {
    if (series.length === 0) return '';
    return series
      .map((point, index) => {
        const x =
          pad.left +
          (series.length === 1
            ? innerW / 2
            : (index / (series.length - 1)) * innerW);
        const y = pad.top + innerH - (point[key] / maxVal) * innerH;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label="Série diária de impressões, custo e clicks"
      >
        <line
          x1={pad.left}
          y1={pad.top + innerH}
          x2={pad.left + innerW}
          y2={pad.top + innerH}
          stroke="#EDEDED"
        />
        <line
          x1={pad.left}
          y1={pad.top}
          x2={pad.left}
          y2={pad.top + innerH}
          stroke="#EDEDED"
        />
        <path
          d={pathFor('impressions')}
          fill="none"
          stroke="#27A59E"
          strokeWidth={2}
        />
        <path d={pathFor('cost')} fill="none" stroke="#F36B20" strokeWidth={2} />
        <path
          d={pathFor('clicks')}
          fill="none"
          stroke="#61BE6B"
          strokeWidth={2}
        />
        {series.length > 0 && (
          <text x={pad.left} y={height - 8} fill="#757575" fontSize={11}>
            {series[0]?.date} → {series[series.length - 1]?.date}
          </text>
        )}
      </svg>
      <Stack direction="row" spacing={2} sx={{ px: 1, pb: 1 }}>
        <Typography variant="caption" sx={{ color: '#27A59E' }}>
          Impressões
        </Typography>
        <Typography variant="caption" sx={{ color: '#F36B20' }}>
          Custo
        </Typography>
        <Typography variant="caption" sx={{ color: '#61BE6B' }}>
          Clicks
        </Typography>
      </Stack>
    </Box>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const companies = user?.companies ?? [];

  const [companyId, setCompanyId] = useState('');
  const [clientId, setClientId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [buyingTypeId, setBuyingTypeId] = useState('');
  const [subGroupingId, setSubGroupingId] = useState('');
  const [from, setFrom] = useState(() => isoDaysAgo(29));
  const [to, setTo] = useState(() => todayIso());
  const [groupByOverride, setGroupByOverride] = useState<AnalyticsGroupBy | ''>(
    '',
  );

  useEffect(() => {
    if (!companyId && companies.length === 1) {
      setCompanyId(companies[0].id);
    }
  }, [companies, companyId]);

  const autoGroupBy = resolveAutoGroupBy({
    companyId,
    clientId,
    campaignId,
    platformId,
    channelId,
    buyingTypeId,
    subGroupingId,
  });
  const groupBy = groupByOverride || autoGroupBy;

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: getCampaigns,
  });
  const { data: platforms = [] } = useQuery({
    queryKey: ['platforms'],
    queryFn: getPlatforms,
  });
  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: getChannels,
  });
  const { data: buyingTypes = [] } = useQuery({
    queryKey: ['buying-types'],
    queryFn: getBuyingTypes,
  });
  const { data: groupings = [] } = useQuery({
    queryKey: ['groupings'],
    queryFn: getGroupings,
    enabled: Boolean(campaignId),
  });
  const { data: subGroupings = [] } = useQuery({
    queryKey: ['sub-groupings'],
    queryFn: getSubGroupings,
    enabled: Boolean(campaignId),
  });
  const { data: channelDetail } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: () => getChannel(channelId),
    enabled: Boolean(channelId),
  });

  const filteredClients = useMemo(
    () => clients.filter((c) => !companyId || c.companyId === companyId),
    [clients, companyId],
  );
  const filteredCampaigns = useMemo(
    () => campaigns.filter((c) => !clientId || c.clientId === clientId),
    [campaigns, clientId],
  );
  const filteredChannels = useMemo(
    () => channels.filter((c) => !platformId || c.platformId === platformId),
    [channels, platformId],
  );
  const campaignGroupingIds = useMemo(
    () =>
      new Set(
        groupings.filter((g) => g.campaignId === campaignId).map((g) => g.id),
      ),
    [groupings, campaignId],
  );
  const filteredSubGroupings = useMemo(
    () => subGroupings.filter((sg) => campaignGroupingIds.has(sg.groupingId)),
    [subGroupings, campaignGroupingIds],
  );
  const channelBuyingTypeIds = useMemo(
    () => new Set(channelDetail?.buyingTypeIds ?? []),
    [channelDetail],
  );
  const filteredBuyingTypes = useMemo(
    () =>
      buyingTypes.filter(
        (bt) => !channelId || channelBuyingTypeIds.has(bt.id),
      ),
    [buyingTypes, channelId, channelBuyingTypeIds],
  );

  const metricsQuery = useMemo(
    () => ({
      companyId: companyId || undefined,
      clientId: clientId || undefined,
      campaignId: campaignId || undefined,
      platformId: platformId || undefined,
      channelId: channelId || undefined,
      buyingTypeId: buyingTypeId || undefined,
      subGroupingId: subGroupingId || undefined,
      from,
      to,
      groupBy,
    }),
    [
      companyId,
      clientId,
      campaignId,
      platformId,
      channelId,
      buyingTypeId,
      subGroupingId,
      from,
      to,
      groupBy,
    ],
  );

  const {
    data: metrics,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['analytics-metrics', metricsQuery],
    queryFn: () => getAnalyticsMetrics(metricsQuery),
  });

  const totals = metrics?.totals;
  const series = metrics?.series ?? [];
  const breakdown = metrics?.breakdown ?? [];

  return (
    <DashboardLayout>
      <Container
        maxWidth="xl"
        sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Métricas agregadas a partir dos fatos do lake enriquecidos pela
              Bridge.
            </Typography>
          </Box>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              useFlexGap
              flexWrap="wrap"
            >
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="filter-company">Empresa</InputLabel>
                <Select
                  labelId="filter-company"
                  label="Empresa"
                  value={companyId}
                  onChange={(e) => {
                    setCompanyId(e.target.value);
                    setClientId('');
                    setCampaignId('');
                    setSubGroupingId('');
                    setGroupByOverride('');
                  }}
                >
                  <MenuItem value="">
                    <em>Todas</em>
                  </MenuItem>
                  {companies.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{ minWidth: 160 }}
                disabled={!companyId && companies.length !== 1}
              >
                <InputLabel id="filter-client">Cliente</InputLabel>
                <Select
                  labelId="filter-client"
                  label="Cliente"
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setCampaignId('');
                    setSubGroupingId('');
                    setGroupByOverride('');
                  }}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {filteredClients.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{ minWidth: 180 }}
                disabled={!clientId}
              >
                <InputLabel id="filter-campaign">Campanha</InputLabel>
                <Select
                  labelId="filter-campaign"
                  label="Campanha"
                  value={campaignId}
                  onChange={(e) => {
                    setCampaignId(e.target.value);
                    setSubGroupingId('');
                    setGroupByOverride('');
                  }}
                >
                  <MenuItem value="">
                    <em>Todas</em>
                  </MenuItem>
                  {filteredCampaigns.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="filter-platform">Plataforma</InputLabel>
                <Select
                  labelId="filter-platform"
                  label="Plataforma"
                  value={platformId}
                  onChange={(e) => {
                    setPlatformId(e.target.value);
                    setChannelId('');
                    setBuyingTypeId('');
                    setGroupByOverride('');
                  }}
                >
                  <MenuItem value="">
                    <em>Todas</em>
                  </MenuItem>
                  {platforms.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{ minWidth: 150 }}
                disabled={!platformId}
              >
                <InputLabel id="filter-channel">Canal</InputLabel>
                <Select
                  labelId="filter-channel"
                  label="Canal"
                  value={channelId}
                  onChange={(e) => {
                    setChannelId(e.target.value);
                    setBuyingTypeId('');
                    setGroupByOverride('');
                  }}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {filteredChannels.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{ minWidth: 150 }}
                disabled={!channelId}
              >
                <InputLabel id="filter-buying">Tipo de compra</InputLabel>
                <Select
                  labelId="filter-buying"
                  label="Tipo de compra"
                  value={buyingTypeId}
                  onChange={(e) => {
                    setBuyingTypeId(e.target.value);
                    setGroupByOverride('');
                  }}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {filteredBuyingTypes.map((bt) => (
                    <MenuItem key={bt.id} value={bt.id}>
                      {bt.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{ minWidth: 170 }}
                disabled={!campaignId}
              >
                <InputLabel id="filter-sg">Sub-agrupamento</InputLabel>
                <Select
                  labelId="filter-sg"
                  label="Sub-agrupamento"
                  value={subGroupingId}
                  onChange={(e) => {
                    setSubGroupingId(e.target.value);
                    setGroupByOverride('');
                  }}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {filteredSubGroupings.map((sg) => (
                    <MenuItem key={sg.id} value={sg.id}>
                      {sg.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="De"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ minWidth: 150 }}
              />
              <TextField
                size="small"
                label="Até"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ minWidth: 150 }}
              />

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="filter-groupby">Granularidade</InputLabel>
                <Select
                  labelId="filter-groupby"
                  label="Granularidade"
                  value={groupBy}
                  onChange={(e) =>
                    setGroupByOverride(e.target.value as AnalyticsGroupBy)
                  }
                >
                  {GROUP_BY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                      {opt.value === autoGroupBy && !groupByOverride
                        ? ' (auto)'
                        : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Paper>

          {isError && (
            <Alert severity="error">
              {getErrorMessage(error, 'Falha ao carregar métricas')}
            </Alert>
          )}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            useFlexGap
            flexWrap="wrap"
          >
            {[
              { label: 'Impressões', value: formatNumber(totals?.impressions) },
              { label: 'Custo', value: formatNumber(totals?.cost, 2) },
              { label: 'Clicks', value: formatNumber(totals?.clicks) },
              {
                label: 'Video views',
                value: formatNumber(totals?.videoViews),
              },
              {
                label: 'Views 100%',
                value: formatNumber(totals?.videoViews100p),
              },
              {
                label: 'Engagement',
                value: formatNumber(totals?.engagement),
              },
            ].map((kpi) => (
              <Paper
                key={kpi.label}
                variant="outlined"
                sx={{ p: 2, minWidth: 140, flex: '1 1 140px' }}
              >
                <Typography variant="caption" color="text.secondary">
                  {kpi.label}
                </Typography>
                <Typography variant="h6">
                  {isLoading ? '…' : kpi.value}
                </Typography>
              </Paper>
            ))}
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            useFlexGap
            flexWrap="wrap"
          >
            {[
              { label: 'CPM', value: formatNumber(totals?.cpm, 2) },
              { label: 'CPC', value: formatNumber(totals?.cpc, 2) },
              { label: 'CPVC', value: formatNumber(totals?.cpvc, 2) },
              { label: 'CPE', value: formatNumber(totals?.cpe, 2) },
              { label: 'CTR', value: formatRate(totals?.ctr) },
              { label: 'VTRC', value: formatRate(totals?.vtrc) },
              { label: 'ER', value: formatRate(totals?.er) },
            ].map((rate) => (
              <Paper
                key={rate.label}
                variant="outlined"
                sx={{
                  px: 2,
                  py: 1.5,
                  minWidth: 110,
                  flex: '1 1 110px',
                  bgcolor: 'action.hover',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {rate.label}
                </Typography>
                <Typography variant="subtitle1">
                  {isLoading ? '…' : rate.value}
                </Typography>
              </Paper>
            ))}
          </Stack>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Série diária
            </Typography>
            {series.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {isLoading ? 'Carregando…' : 'Sem pontos no período.'}
              </Typography>
            ) : (
              <SeriesChart series={series} />
            )}
          </Paper>

          {groupBy !== 'date' && (
            <Paper variant="outlined">
              <Box sx={{ px: 2, pt: 2 }}>
                <Typography variant="subtitle1">
                  Breakdown por{' '}
                  {GROUP_BY_OPTIONS.find((o) => o.value === groupBy)?.label ??
                    groupBy}
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Dimensão</TableCell>
                      <TableCell align="right">Impressões</TableCell>
                      <TableCell align="right">Custo</TableCell>
                      <TableCell align="right">Clicks</TableCell>
                      <TableCell align="right">Views</TableCell>
                      <TableCell align="right">Views 100%</TableCell>
                      <TableCell align="right">Engagement</TableCell>
                      <TableCell align="right">CPM</TableCell>
                      <TableCell align="right">CPC</TableCell>
                      <TableCell align="right">CTR</TableCell>
                      <TableCell align="right">ER</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {breakdown.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11}>
                          {isLoading
                            ? 'Carregando…'
                            : 'Nenhum dado para o recorte atual.'}
                        </TableCell>
                      </TableRow>
                    )}
                    {breakdown.map((row) => (
                      <TableRow key={row.key ?? row.label}>
                        <TableCell>{row.label ?? row.key}</TableCell>
                        <TableCell align="right">
                          {formatNumber(row.impressions)}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(row.cost, 2)}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(row.clicks)}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(row.videoViews)}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(row.videoViews100p)}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(row.engagement)}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(row.cpm, 2)}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(row.cpc, 2)}
                        </TableCell>
                        <TableCell align="right">
                          {formatRate(row.ctr)}
                        </TableCell>
                        <TableCell align="right">
                          {formatRate(row.er)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Stack>
      </Container>
    </DashboardLayout>
  );
}
