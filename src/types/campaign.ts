export interface CampaignSummary {
  id: string;
  name: string;
  isActive: boolean;
  clientId: string;
}

export interface CampaignDetail extends CampaignSummary {
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignPayload {
  name: string;
  description: string;
  clientId: string;
  isActive?: boolean;
}

export interface UpdateCampaignItem {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface BulkUpdateCampaignsPayload {
  campaigns: UpdateCampaignItem[];
}
