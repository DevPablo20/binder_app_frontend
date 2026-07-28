export type AnalyticsGroupBy =
  | 'company'
  | 'client'
  | 'campaign'
  | 'platform'
  | 'channel'
  | 'buying_type'
  | 'sub_grouping'
  | 'date';

export interface MetricBlock {
  key?: string;
  label?: string;
  date?: string;
  impressions: number;
  cost: number;
  clicks: number;
  videoViews: number;
  videoViews100p: number;
  engagement: number;
  cpm: number | null;
  cpc: number | null;
  cpvc: number | null;
  cpe: number | null;
  ctr: number | null;
  vtrc: number | null;
  er: number | null;
}

export interface AnalyticsMetricsResponse {
  groupBy: AnalyticsGroupBy;
  from: string;
  to: string;
  totals: MetricBlock;
  series: MetricBlock[];
  breakdown: MetricBlock[];
}

export interface AnalyticsMetricsQuery {
  companyId?: string;
  clientId?: string;
  campaignId?: string;
  platformId?: string;
  channelId?: string;
  buyingTypeId?: string;
  subGroupingId?: string;
  from?: string;
  to?: string;
  groupBy?: AnalyticsGroupBy;
}
