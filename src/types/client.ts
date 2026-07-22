export interface ClientSummary {
  id: string;
  name: string;
  isActive: boolean;
  companyId: string;
}

export interface ClientDetail extends ClientSummary {
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientPayload {
  name: string;
  description: string;
  companyId: string;
  isActive?: boolean;
}

export interface UpdateClientItem {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface BulkUpdateClientsPayload {
  clients: UpdateClientItem[];
}
