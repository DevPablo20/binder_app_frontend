export interface ChannelSummary {
  id: string;
  name: string;
  isActive: boolean;
  platformId: string;
}

export interface ChannelDetail extends ChannelSummary {
  description: string;
  buyingTypeIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelItem {
  name: string;
  description: string;
  isActive?: boolean;
  buyingTypeIds?: string[];
}

export interface CreateChannelsPayload {
  platformId: string;
  channels: CreateChannelItem[];
}

export interface UpdateChannelItem {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  buyingTypeIds?: string[];
}

export interface BulkUpdateChannelsPayload {
  channels: UpdateChannelItem[];
}
