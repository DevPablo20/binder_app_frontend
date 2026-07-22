import { apiFetch } from '@/api/client';
import type {
  BulkUpdateCampaignsPayload,
  CampaignDetail,
  CampaignSummary,
  CreateCampaignPayload,
} from '@/types/campaign';

export function getCampaigns(): Promise<CampaignSummary[]> {
  return apiFetch<CampaignSummary[]>('/business/campaigns');
}

export function getCampaign(id: string): Promise<CampaignDetail> {
  return apiFetch<CampaignDetail>(`/business/campaigns/${id}`);
}

export function createCampaign(
  body: CreateCampaignPayload,
): Promise<CampaignDetail> {
  return apiFetch<CampaignDetail>('/business/campaigns', {
    method: 'POST',
    body,
  });
}

export function updateCampaigns(
  body: BulkUpdateCampaignsPayload,
): Promise<CampaignDetail[]> {
  return apiFetch<CampaignDetail[]>('/business/campaigns', {
    method: 'PATCH',
    body,
  });
}
