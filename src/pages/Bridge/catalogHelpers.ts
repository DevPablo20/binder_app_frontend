import type { CatalogItem, PlatformObjectType } from '@/types/bridge';

export function catalogExternalId(
  item: CatalogItem,
  objectType: PlatformObjectType,
): string {
  switch (objectType) {
    case 'campaign':
      return item.campaignId ?? '';
    case 'ad_group':
      return item.adGroupId ?? '';
    case 'ad':
      return item.adId ?? '';
  }
}

export function catalogExternalName(
  item: CatalogItem,
  objectType: PlatformObjectType,
): string | null {
  switch (objectType) {
    case 'campaign':
      return item.campaignName ?? null;
    case 'ad_group':
      return item.adGroupName ?? null;
    case 'ad':
      return item.adName ?? null;
  }
}

export function toggleIdInSet(prev: Set<string>, id: string): Set<string> {
  const next = new Set(prev);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function toggleAllInSet(
  prev: Set<string>,
  ids: string[],
): Set<string> {
  const next = new Set(prev);
  const allSelected = ids.length > 0 && ids.every((id) => next.has(id));
  if (allSelected) {
    for (const id of ids) next.delete(id);
  } else {
    for (const id of ids) next.add(id);
  }
  return next;
}
