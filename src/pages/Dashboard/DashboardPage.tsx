import {
  Alert,
  Box,
  Checkbox,
  Container,
  FormControl,
  InputLabel,
  ListItemText,
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
import { type MouseEvent, useEffect, useMemo, useState } from 'react';

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
import { InsightsChatDrawer } from '@/pages/Dashboard/InsightsChatDrawer';
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

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatDateInput(d);
}

function todayIso(): string {
  return formatDateInput(new Date());
}

function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `R$ ${formatNumber(value, 2)}`;
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

type ChartMetricKey =
  | 'impressions'
  | 'cost'
  | 'clicks'
  | 'videoViews'
  | 'videoViews100p'
  | 'engagement'
  | 'cpm'
  | 'cpc'
  | 'cpvc'
  | 'cpe'
  | 'vtr'
  | 'vtrc'
  | 'ctr'
  | 'er';

type MetricDisplayDef = {
  key: ChartMetricKey;
  label: string;
  color: string;
  format: (value: number | null | undefined) => string;
};

const METRIC_DEFS: MetricDisplayDef[] = [
  {
    key: 'impressions',
    label: 'Impressões',
    color: '#27A59E',
    format: (value) => formatNumber(value),
  },
  {
    key: 'cost',
    label: 'Investimento',
    color: '#F36B20',
    format: (value) => formatCurrency(value),
  },
  {
    key: 'clicks',
    label: 'Cliques',
    color: '#61BE6B',
    format: (value) => formatNumber(value),
  },
  {
    key: 'videoViews',
    label: 'Visualizações',
    color: '#B388FF',
    format: (value) => formatNumber(value),
  },
  {
    key: 'videoViews100p',
    label: 'Visualizações 100%',
    color: '#64B5F6',
    format: (value) => formatNumber(value),
  },
  {
    key: 'engagement',
    label: 'Engajamentos',
    color: '#FFB74D',
    format: (value) => formatNumber(value),
  },
  {
    key: 'cpm',
    label: 'CPM',
    color: '#EF5350',
    format: (value) => formatCurrency(value),
  },
  {
    key: 'cpc',
    label: 'CPC',
    color: '#EC407A',
    format: (value) => formatCurrency(value),
  },
  {
    key: 'cpvc',
    label: 'CPVc',
    color: '#AB47BC',
    format: (value) => formatCurrency(value),
  },
  {
    key: 'cpe',
    label: 'CPE',
    color: '#7E57C2',
    format: (value) => formatCurrency(value),
  },
  {
    key: 'vtr',
    label: 'VTR',
    color: '#5C6BC0',
    format: (value) => formatRate(value),
  },
  {
    key: 'vtrc',
    label: 'VTRc',
    color: '#29B6F6',
    format: (value) => formatRate(value),
  },
  {
    key: 'ctr',
    label: 'CTR',
    color: '#26C6DA',
    format: (value) => formatRate(value),
  },
  {
    key: 'er',
    label: 'ER',
    color: '#9CCC65',
    format: (value) => formatRate(value),
  },
];

const METRIC_DEF_MAP = Object.fromEntries(
  METRIC_DEFS.map((metric) => [metric.key, metric]),
) as Record<ChartMetricKey, MetricDisplayDef>;

const PRIMARY_METRICS: ChartMetricKey[] = [
  'impressions',
  'cost',
  'clicks',
  'videoViews',
  'videoViews100p',
  'engagement',
];

const COST_METRICS: ChartMetricKey[] = ['cpm', 'cpc', 'cpvc', 'cpe'];
const REACH_METRICS: ChartMetricKey[] = ['vtr', 'vtrc', 'ctr', 'er'];

const MAX_CHART_METRICS = 2;

function maxForMetric(series: MetricBlock[], key: ChartMetricKey): number {
  let max = 0;
  for (const point of series) {
    max = Math.max(max, point[key] ?? 0);
  }
  return max || 0;
}

/** Round a range into a clean 1/2/5 * 10^n step. */
function niceStep(range: number, round: boolean): number {
  if (!Number.isFinite(range) || range <= 0) return 1;
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / 10 ** exponent;
  let niceFraction: number;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;
  return niceFraction * 10 ** exponent;
}

/** Build a constant Y scale with round ticks (e.g. 0, 1M, 2M… / 0, 5k, 10k…). */
function niceScale(
  rawMax: number,
  desiredTicks = 5,
): { max: number; ticks: number[] } {
  if (!Number.isFinite(rawMax) || rawMax <= 0) {
    return { max: 1, ticks: [0, 0.25, 0.5, 0.75, 1] };
  }
  const step = niceStep(rawMax / (desiredTicks - 1), true);
  const max = Math.ceil(rawMax / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= max + step * 1e-9; value += step) {
    ticks.push(Number(value.toPrecision(12)));
  }
  return { max, ticks };
}

function SeriesChart({
  series,
  selectedMetrics,
}: {
  series: MetricBlock[];
  selectedMetrics: ChartMetricKey[];
}) {
  const width = 900;
  const height = 280;
  const pad = { top: 20, right: 72, bottom: 32, left: 72 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const activeMetrics = selectedMetrics
    .slice(0, MAX_CHART_METRICS)
    .map((key) => METRIC_DEF_MAP[key])
    .filter(Boolean);
  const leftMetric = activeMetrics[0];
  const rightMetric = activeMetrics[1];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const leftScale = useMemo(
    () => niceScale(leftMetric ? maxForMetric(series, leftMetric.key) : 0),
    [leftMetric, series],
  );
  const rightScale = useMemo(
    () => niceScale(rightMetric ? maxForMetric(series, rightMetric.key) : 0),
    [rightMetric, series],
  );

  const dateTicks = useMemo(() => {
    if (series.length <= 1) return series;
    const tickCount = Math.min(series.length, 6);
    return Array.from({ length: tickCount }, (_, index) => {
      const pointIndex = Math.round(
        (index * (series.length - 1)) / (tickCount - 1),
      );
      return series[pointIndex];
    });
  }, [series]);

  const pointX = (index: number) =>
    pad.left +
    (series.length === 1 ? innerW / 2 : (index / (series.length - 1)) * innerW);

  const pointY = (point: MetricBlock, key: ChartMetricKey, maxVal: number) => {
    const rawValue = point[key] ?? 0;
    return pad.top + innerH - (rawValue / maxVal) * innerH;
  };

  const pathFor = (key: ChartMetricKey, maxVal: number) =>
    series
      .map((point, index) => {
        const x = pointX(index);
        const y = pointY(point, key, maxVal);
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

  const hoveredPoint =
    hoveredIndex === null
      ? null
      : series[Math.min(hoveredIndex, series.length - 1)];
  const hoveredX =
    hoveredIndex === null ? null : pointX(hoveredIndex);

  const handleMouseMove = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * width;
    const clampedX = Math.min(
      Math.max(relativeX, pad.left),
      pad.left + innerW,
    );
    const nextIndex = series.reduce((nearestIndex, _point, index) => {
      const currentDistance = Math.abs(pointX(index) - clampedX);
      const nearestDistance = Math.abs(pointX(nearestIndex) - clampedX);
      return currentDistance < nearestDistance ? index : nearestIndex;
    }, 0);
    setHoveredIndex(nextIndex);
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label="Série diária das métricas selecionadas"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
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
          stroke={leftMetric?.color ?? '#EDEDED'}
        />
        {rightMetric && (
          <line
            x1={pad.left + innerW}
            y1={pad.top}
            x2={pad.left + innerW}
            y2={pad.top + innerH}
            stroke={rightMetric.color}
          />
        )}

        {leftScale.ticks.map((tickValue) => {
          const y = pad.top + innerH - (tickValue / leftScale.max) * innerH;
          return (
            <g key={`left-tick-${tickValue}`}>
              <line
                x1={pad.left}
                y1={y}
                x2={pad.left + innerW}
                y2={y}
                stroke="#2A2A2A"
                strokeDasharray="3 4"
              />
              {leftMetric && (
                <text
                  x={pad.left - 8}
                  y={y + 3}
                  fill={leftMetric.color}
                  fontSize={10}
                  textAnchor="end"
                >
                  {leftMetric.format(tickValue)}
                </text>
              )}
            </g>
          );
        })}

        {rightMetric &&
          rightScale.ticks.map((tickValue) => {
            const y = pad.top + innerH - (tickValue / rightScale.max) * innerH;
            return (
              <text
                key={`right-tick-${tickValue}`}
                x={pad.left + innerW + 8}
                y={y + 3}
                fill={rightMetric.color}
                fontSize={10}
                textAnchor="start"
              >
                {rightMetric.format(tickValue)}
              </text>
            );
          })}

        {leftMetric && (
          <path
            d={pathFor(leftMetric.key, leftScale.max)}
            fill="none"
            stroke={leftMetric.color}
            strokeWidth={2}
          />
        )}
        {rightMetric && (
          <path
            d={pathFor(rightMetric.key, rightScale.max)}
            fill="none"
            stroke={rightMetric.color}
            strokeWidth={2}
          />
        )}

        {hoveredPoint && hoveredX !== null && (
          <line
            x1={hoveredX}
            y1={pad.top}
            x2={hoveredX}
            y2={pad.top + innerH}
            stroke="#8C8C8C"
            strokeDasharray="4 4"
          />
        )}
        {hoveredPoint && hoveredX !== null && leftMetric && (
          <circle
            cx={hoveredX}
            cy={pointY(hoveredPoint, leftMetric.key, leftScale.max)}
            r={4}
            fill={leftMetric.color}
          />
        )}
        {hoveredPoint && hoveredX !== null && rightMetric && (
          <circle
            cx={hoveredX}
            cy={pointY(hoveredPoint, rightMetric.key, rightScale.max)}
            r={4}
            fill={rightMetric.color}
          />
        )}

        {dateTicks.map((point, index) => {
          const pointIndex = series.findIndex(
            (entry) => entry.date === point.date,
          );
          const x = pointX(pointIndex);
          return (
            <g key={`${point.date}-${index}`}>
              <line
                x1={x}
                y1={pad.top + innerH}
                x2={x}
                y2={pad.top + innerH + 4}
                stroke="#757575"
              />
              <text
                x={x}
                y={height - 8}
                fill="#757575"
                fontSize={11}
                textAnchor="middle"
              >
                {point.date}
              </text>
            </g>
          );
        })}
      </svg>
      <Stack
        direction="row"
        spacing={2}
        useFlexGap
        sx={{ px: 1, pb: 1, flexWrap: 'wrap' }}
      >
        {leftMetric && (
          <Typography variant="caption" sx={{ color: leftMetric.color }}>
            {leftMetric.label} (eixo esquerdo)
          </Typography>
        )}
        {rightMetric && (
          <Typography variant="caption" sx={{ color: rightMetric.color }}>
            {rightMetric.label} (eixo direito)
          </Typography>
        )}
      </Stack>
      {hoveredPoint && (
        <Paper variant="outlined" sx={{ mt: 1, p: 1.5 }}>
          <Typography variant="subtitle2" gutterBottom>
            {hoveredPoint.date?.replaceAll('-', '/')}
          </Typography>
          <Stack
            direction="row"
            spacing={2}
            useFlexGap
            sx={{ flexWrap: 'wrap' }}
          >
            {activeMetrics.map((metric) => (
              <Typography key={`tooltip-${metric.key}`} variant="body2">
                <Box component="span" sx={{ color: metric.color }}>
                  {metric.label}:
                </Box>{' '}
                {metric.format(hoveredPoint[metric.key] ?? null)}
              </Typography>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}

function MetricSection({
  title,
  metrics,
  totals,
  isLoading,
  minCardWidth,
}: {
  title: string;
  metrics: ChartMetricKey[];
  totals: MetricBlock | undefined;
  isLoading: boolean;
  minCardWidth: number;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1">{title}</Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${minCardWidth}px, 1fr))`,
            gap: 2,
          }}
        >
          {metrics.map((metricKey) => {
            const metric = METRIC_DEF_MAP[metricKey];
            return (
              <Paper
                key={metric.key}
                variant="outlined"
                sx={{ p: 2, minWidth: 0, bgcolor: 'background.paper' }}
              >
                <Typography variant="caption" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography variant="h6">
                  {isLoading ? '…' : metric.format(totals?.[metric.key] ?? null)}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </Stack>
    </Paper>
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
  const [groupByOverride, setGroupByOverride] = useState<AnalyticsGroupBy | ''>('');
  const [selectedChartMetrics, setSelectedChartMetrics] = useState<ChartMetricKey[]>([
    'impressions',
    'cost',
  ]);

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
      buyingTypes.filter((bt) => !channelId || channelBuyingTypeIds.has(bt.id)),
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
        maxWidth={false}
        sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 }, width: '100%' }}
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
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 2,
              }}
            >
              <FormControl size="small" fullWidth>
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
                fullWidth
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

              <FormControl size="small" fullWidth disabled={!clientId}>
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

              <FormControl size="small" fullWidth>
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

              <FormControl size="small" fullWidth disabled={!platformId}>
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

              <FormControl size="small" fullWidth disabled={!channelId}>
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

              <FormControl size="small" fullWidth disabled={!campaignId}>
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
                fullWidth
              />
              <TextField
                size="small"
                label="Até"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />

              <FormControl size="small" fullWidth>
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
            </Box>
          </Paper>

          {isError && (
            <Alert severity="error">
              {getErrorMessage(error, 'Falha ao carregar métricas')}
            </Alert>
          )}

          <MetricSection
            title="Métricas primárias"
            metrics={PRIMARY_METRICS}
            totals={totals}
            isLoading={isLoading}
            minCardWidth={180}
          />

          <MetricSection
            title="Métricas de Custo"
            metrics={COST_METRICS}
            totals={totals}
            isLoading={isLoading}
            minCardWidth={160}
          />

          <MetricSection
            title="Métricas de Alcance"
            metrics={REACH_METRICS}
            totals={totals}
            isLoading={isLoading}
            minCardWidth={160}
          />

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{
                mb: 2,
                alignItems: { xs: 'stretch', md: 'center' },
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="subtitle1">Série diária</Typography>
                <Typography variant="body2" color="text.secondary">
                  Selecione até 2 métricas. A primeira usa o eixo Y esquerdo e a
                  segunda o eixo Y direito.
                </Typography>
              </Box>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 320 } }}>
                <InputLabel id="chart-metrics">Métricas do gráfico</InputLabel>
                <Select
                  multiple
                  labelId="chart-metrics"
                  label="Métricas do gráfico"
                  value={selectedChartMetrics}
                  renderValue={(selected) =>
                    (selected as ChartMetricKey[])
                      .map((key) => METRIC_DEF_MAP[key].label)
                      .join(', ')
                  }
                  onChange={(e) => {
                    const value = e.target.value as ChartMetricKey[];
                    if (value.length === 0) return;
                    setSelectedChartMetrics(value.slice(0, MAX_CHART_METRICS));
                  }}
                >
                  {METRIC_DEFS.map((metric) => {
                    const isSelected = selectedChartMetrics.includes(metric.key);
                    const atLimit =
                      selectedChartMetrics.length >= MAX_CHART_METRICS &&
                      !isSelected;
                    return (
                      <MenuItem
                        key={metric.key}
                        value={metric.key}
                        disabled={atLimit}
                      >
                        <Checkbox checked={isSelected} />
                        <ListItemText primary={metric.label} />
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Stack>
            {series.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {isLoading ? 'Carregando…' : 'Sem pontos no período.'}
              </Typography>
            ) : (
              <SeriesChart
                series={series}
                selectedMetrics={selectedChartMetrics}
              />
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
                      <TableCell align="right">Investimento</TableCell>
                      <TableCell align="right">Cliques</TableCell>
                      <TableCell align="right">Visualizações</TableCell>
                      <TableCell align="right">Views 100%</TableCell>
                      <TableCell align="right">Engajamentos</TableCell>
                      <TableCell align="right">CPM</TableCell>
                      <TableCell align="right">CPC</TableCell>
                      <TableCell align="right">CPVc</TableCell>
                      <TableCell align="right">CPE</TableCell>
                      <TableCell align="right">VTR</TableCell>
                      <TableCell align="right">VTRc</TableCell>
                      <TableCell align="right">CTR</TableCell>
                      <TableCell align="right">ER</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {breakdown.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={15}>
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
                          {formatCurrency(row.cost)}
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
                        <TableCell align="right">{formatCurrency(row.cpm)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.cpc)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.cpvc)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.cpe)}</TableCell>
                        <TableCell align="right">{formatRate(row.vtr)}</TableCell>
                        <TableCell align="right">{formatRate(row.vtrc)}</TableCell>
                        <TableCell align="right">{formatRate(row.ctr)}</TableCell>
                        <TableCell align="right">{formatRate(row.er)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Stack>
      </Container>
      <InsightsChatDrawer context={metricsQuery} />
    </DashboardLayout>
  );
}
