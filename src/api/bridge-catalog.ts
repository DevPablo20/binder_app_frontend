import { apiFetch } from '@/api/client';
import type { CatalogItem, CatalogQuery } from '@/types/bridge';

function buildQuery(params: CatalogQuery): string {
  const search = new URLSearchParams();
  if (params.objectType) search.set('objectType', params.objectType);
  if (params.unmatchedOnly !== undefined) {
    search.set('unmatchedOnly', String(params.unmatchedOnly));
  }
  if (params.clientId) search.set('clientId', params.clientId);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function getCatalog(
  platformId: string,
  query: CatalogQuery = {},
): Promise<CatalogItem[]> {
  return apiFetch<CatalogItem[]>(
    `/bridge/catalog/${platformId}${buildQuery(query)}`,
  );
}
