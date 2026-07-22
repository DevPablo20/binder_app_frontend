import { apiFetch } from '@/api/client';
import type {
  BulkUpdateBuyingTypesPayload,
  BuyingTypeDetail,
  BuyingTypeSummary,
  CreateBuyingTypesPayload,
} from '@/types/buying-type';

export function getBuyingTypes(): Promise<BuyingTypeSummary[]> {
  return apiFetch<BuyingTypeSummary[]>('/media/buying-types');
}

export function getBuyingType(id: string): Promise<BuyingTypeDetail> {
  return apiFetch<BuyingTypeDetail>(`/media/buying-types/${id}`);
}

export function createBuyingTypes(
  body: CreateBuyingTypesPayload,
): Promise<BuyingTypeDetail[]> {
  return apiFetch<BuyingTypeDetail[]>('/media/buying-types', {
    method: 'POST',
    body,
  });
}

export function updateBuyingTypes(
  body: BulkUpdateBuyingTypesPayload,
): Promise<BuyingTypeDetail[]> {
  return apiFetch<BuyingTypeDetail[]>('/media/buying-types', {
    method: 'PATCH',
    body,
  });
}
