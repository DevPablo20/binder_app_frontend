import { apiFetch } from '@/api/client';
import type {
  AnalyticsChatRequest,
  AnalyticsChatResponse,
  AnalyticsMetricsQuery,
  AnalyticsMetricsResponse,
} from '@/types/analytics';

function toQuery(params: AnalyticsMetricsQuery): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function getAnalyticsMetrics(
  query: AnalyticsMetricsQuery,
): Promise<AnalyticsMetricsResponse> {
  return apiFetch<AnalyticsMetricsResponse>(
    `/analytics/metrics${toQuery(query)}`,
  );
}

export function postAnalyticsChat(
  body: AnalyticsChatRequest,
): Promise<AnalyticsChatResponse> {
  return apiFetch<AnalyticsChatResponse>('/analytics/chat', {
    method: 'POST',
    body,
  });
}
