import { apiFetch } from '@/api/client';
import type {
  BulkUpdateChannelsPayload,
  ChannelDetail,
  ChannelSummary,
  CreateChannelsPayload,
} from '@/types/channel';

export function getChannels(): Promise<ChannelSummary[]> {
  return apiFetch<ChannelSummary[]>('/media/channels');
}

export function getChannel(id: string): Promise<ChannelDetail> {
  return apiFetch<ChannelDetail>(`/media/channels/${id}`);
}

export function createChannels(
  body: CreateChannelsPayload,
): Promise<ChannelDetail[]> {
  return apiFetch<ChannelDetail[]>('/media/channels', {
    method: 'POST',
    body,
  });
}

export function updateChannels(
  body: BulkUpdateChannelsPayload,
): Promise<ChannelDetail[]> {
  return apiFetch<ChannelDetail[]>('/media/channels', {
    method: 'PATCH',
    body,
  });
}
