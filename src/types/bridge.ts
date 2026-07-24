export type CatalogObjectType = 'account' | 'campaign' | 'ad_group' | 'ad';

export type PlatformObjectType = 'campaign' | 'ad_group' | 'ad';

export interface CatalogItem {
  platform: string;
  objectType: CatalogObjectType;
  accountId: string;
  accountName: string;
  campaignId?: string | null;
  campaignName?: string | null;
  adGroupId?: string | null;
  adGroupName?: string | null;
  adId?: string | null;
  adName?: string | null;
  isMapped: boolean;
  platformAccountId?: string | null;
  platformObjectMapId?: string | null;
}

export interface CatalogQuery {
  objectType?: CatalogObjectType;
  unmatchedOnly?: boolean;
  clientId?: string;
}

export interface PlatformAccountSummary {
  id: string;
  externalAccountId: string;
  name: string;
  isActive: boolean;
  clientId: string;
  clientName: string;
  platformId: string;
  platformName: string;
}

export interface PlatformAccountDetail extends PlatformAccountSummary {
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformAccountPayload {
  externalAccountId: string;
  name: string;
  clientId: string;
  platformId: string;
  isActive?: boolean;
}

export interface BulkCreatePlatformAccountsPayload {
  platformId: string;
  accounts: Array<{
    externalAccountId: string;
    name: string;
  }>;
  clientIds: string[];
  isActive?: boolean;
}

export interface PlatformAccountQuery {
  platformId?: string;
  clientId?: string;
  isActive?: boolean;
}

export interface UpdatePlatformAccountItem {
  id: string;
  name?: string;
  clientId?: string;
  isActive?: boolean;
}

export interface BulkUpdatePlatformAccountsPayload {
  platformAccounts: UpdatePlatformAccountItem[];
}

export interface BulkDeleteIdsPayload {
  ids: string[];
}

export interface PlatformObjectMapSummary {
  id: string;
  objectType: PlatformObjectType;
  externalId: string;
  externalName?: string | null;
  isActive: boolean;
  platformAccountId: string;
  campaignId: string;
  channelId?: string | null;
  buyingTypeId?: string | null;
  formatId?: string | null;
  subFormatId?: string | null;
  subGroupingIds: string[];
}

export interface PlatformObjectMapDetail extends PlatformObjectMapSummary {
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformObjectMapPayload {
  platformAccountId: string;
  objectType: PlatformObjectType;
  externalId: string;
  campaignId: string;
  externalName?: string | null;
  channelId?: string;
  buyingTypeId?: string;
  formatId?: string;
  subFormatId?: string;
  subGroupingIds?: string[];
  isActive?: boolean;
}

export interface PlatformObjectMapQuery {
  platformAccountId?: string;
  campaignId?: string;
  objectType?: PlatformObjectType;
  isActive?: boolean;
}

export interface UpdatePlatformObjectMapItem {
  id: string;
  externalName?: string | null;
  campaignId?: string;
  channelId?: string | null;
  buyingTypeId?: string | null;
  formatId?: string | null;
  subFormatId?: string | null;
  subGroupingIds?: string[];
  isActive?: boolean;
}

export interface BulkUpdatePlatformObjectMapsPayload {
  platformObjectMaps: UpdatePlatformObjectMapItem[];
}
