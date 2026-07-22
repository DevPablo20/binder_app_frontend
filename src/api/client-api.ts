import { apiFetch } from '@/api/client';
import type {
  BulkUpdateClientsPayload,
  ClientDetail,
  ClientSummary,
  CreateClientPayload,
} from '@/types/client';

export function getClients(): Promise<ClientSummary[]> {
  return apiFetch<ClientSummary[]>('/business/clients');
}

export function getClient(id: string): Promise<ClientDetail> {
  return apiFetch<ClientDetail>(`/business/clients/${id}`);
}

export function createClient(body: CreateClientPayload): Promise<ClientDetail> {
  return apiFetch<ClientDetail>('/business/clients', {
    method: 'POST',
    body,
  });
}

export function updateClients(
  body: BulkUpdateClientsPayload,
): Promise<ClientDetail[]> {
  return apiFetch<ClientDetail[]>('/business/clients', {
    method: 'PATCH',
    body,
  });
}
