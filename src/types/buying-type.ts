export interface BuyingTypeSummary {
  id: string;
  name: string;
  isActive: boolean;
}

export interface BuyingTypeDetail extends BuyingTypeSummary {
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuyingTypeItem {
  name: string;
  description: string;
  isActive?: boolean;
}

export interface CreateBuyingTypesPayload {
  buyingTypes: CreateBuyingTypeItem[];
}

export interface UpdateBuyingTypeItem {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface BulkUpdateBuyingTypesPayload {
  buyingTypes: UpdateBuyingTypeItem[];
}
