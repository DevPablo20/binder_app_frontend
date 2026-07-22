export interface GroupingSummary {
  id: string;
  name: string;
  isActive: boolean;
  campaignId: string;
}

export interface GroupingDetail extends GroupingSummary {
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupingPayload {
  name: string;
  description: string;
  campaignId: string;
  isActive?: boolean;
}

export interface UpdateGroupingItem {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface BulkUpdateGroupingsPayload {
  groupings: UpdateGroupingItem[];
}

export interface SubGroupingSummary {
  id: string;
  name: string;
  isActive: boolean;
  groupingId: string;
}

export interface SubGroupingDetail extends SubGroupingSummary {
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubGroupingItem {
  name: string;
  description: string;
  isActive?: boolean;
}

export interface CreateSubGroupingsPayload {
  groupingId: string;
  subGroupings: CreateSubGroupingItem[];
}

export interface UpdateSubGroupingItem {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface BulkUpdateSubGroupingsPayload {
  subGroupings: UpdateSubGroupingItem[];
}
