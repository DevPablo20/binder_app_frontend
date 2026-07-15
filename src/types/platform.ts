export interface PlatformSummary {
  id: string;
  name: string;
  isActive: boolean;
}

export interface PlatformDetail extends PlatformSummary {
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformPayload {
  name: string;
  description: string;
  isActive?: boolean;
}

export interface UpdatePlatformItem {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface BulkUpdatePlatformsPayload {
  platforms: UpdatePlatformItem[];
}
