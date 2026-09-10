import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';

import type { BuyingTypeSummary } from '@/types/buying-type';
import type { CampaignSummary } from '@/types/campaign';
import type { ChannelDetail, ChannelSummary } from '@/types/channel';

export interface AssociateCampaignPreview {
  externalAccountId: string;
  accountName: string;
  externalCampaignId: string;
  campaignName: string;
}

interface AssociateCampaignsDialogProps {
  open: boolean;
  items: AssociateCampaignPreview[];
  campaigns: CampaignSummary[];
  channels: ChannelSummary[];
  channelDetail?: ChannelDetail | null;
  buyingTypes: BuyingTypeSummary[];
  platformId: string;
  selectedCampaignId: string;
  selectedChannelId: string;
  selectedBuyingTypeId: string;
  onSelectedCampaignIdChange: (campaignId: string) => void;
  onSelectedChannelIdChange: (channelId: string) => void;
  onSelectedBuyingTypeIdChange: (buyingTypeId: string) => void;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AssociateCampaignsDialog({
  open,
  items,
  campaigns,
  channels,
  channelDetail,
  buyingTypes,
  platformId,
  selectedCampaignId,
  selectedChannelId,
  selectedBuyingTypeId,
  onSelectedCampaignIdChange,
  onSelectedChannelIdChange,
  onSelectedBuyingTypeIdChange,
  loading = false,
  onCancel,
  onConfirm,
}: AssociateCampaignsDialogProps) {
  const selectedCampaign = campaigns.find(
    (campaign) => campaign.id === selectedCampaignId,
  );

  const platformChannels = useMemo(
    () =>
      channels.filter(
        (channel) => channel.isActive && channel.platformId === platformId,
      ),
    [channels, platformId],
  );

  const allowedBuyingTypes = useMemo(() => {
    const allowed = new Set(channelDetail?.buyingTypeIds ?? []);
    return buyingTypes.filter(
      (buyingType) => buyingType.isActive && allowed.has(buyingType.id),
    );
  }, [buyingTypes, channelDetail]);

  const selectedChannel = platformChannels.find(
    (channel) => channel.id === selectedChannelId,
  );
  const selectedBuyingType = allowedBuyingTypes.find(
    (buyingType) => buyingType.id === selectedBuyingTypeId,
  );

  const activeCampaignOptions = campaigns.filter(
    (campaign) => campaign.isActive,
  );

  const canConfirm =
    items.length > 0 &&
    Boolean(selectedCampaignId && selectedChannelId && selectedBuyingTypeId) &&
    !loading;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Criar associação</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Selecione a campanha Binder, canal e tipo de compra para associar às{' '}
            {items.length} campanha(s) ETL selecionada(s).
          </Typography>

          <FormControl size="small" fullWidth>
            <InputLabel id="associate-binder-campaign-label">
              Campanha Binder
            </InputLabel>
            <Select
              labelId="associate-binder-campaign-label"
              label="Campanha Binder"
              value={selectedCampaignId}
              onChange={(event) => {
                onSelectedCampaignIdChange(event.target.value);
              }}
              disabled={loading}
            >
              {activeCampaignOptions.map((campaign) => (
                <MenuItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth disabled={!platformId || loading}>
            <InputLabel id="associate-channel-label">Canal</InputLabel>
            <Select
              labelId="associate-channel-label"
              label="Canal"
              value={selectedChannelId}
              onChange={(event) => {
                onSelectedChannelIdChange(event.target.value);
                onSelectedBuyingTypeIdChange('');
              }}
            >
              {platformChannels.map((channel) => (
                <MenuItem key={channel.id} value={channel.id}>
                  {channel.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            size="small"
            fullWidth
            disabled={!selectedChannelId || loading}
          >
            <InputLabel id="associate-buying-type-label">
              Tipo de compra
            </InputLabel>
            <Select
              labelId="associate-buying-type-label"
              label="Tipo de compra"
              value={selectedBuyingTypeId}
              onChange={(event) =>
                onSelectedBuyingTypeIdChange(event.target.value)
              }
            >
              {allowedBuyingTypes.map((buyingType) => (
                <MenuItem key={buyingType.id} value={buyingType.id}>
                  {buyingType.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedCampaign &&
            selectedChannel &&
            selectedBuyingType && (
              <Stack spacing={1}>
                <Typography variant="subtitle2">
                  Confira as associações
                </Typography>
                {items.map((item) => (
                  <Typography
                    key={`${item.externalAccountId}:${item.externalCampaignId}`}
                    variant="body2"
                  >
                    {item.accountName} / {item.campaignName} (
                    {item.externalCampaignId}) → {selectedCampaign.name} ·{' '}
                    {selectedChannel.name} · {selectedBuyingType.name}
                  </Typography>
                ))}
              </Stack>
            )}

          {items.length > 1 &&
            selectedCampaignId &&
            selectedChannelId &&
            selectedBuyingTypeId && (
              <Alert severity="warning">
                Você está aplicando o mesmo enriquecimento (
                {selectedCampaign?.name} / {selectedChannel?.name} /{' '}
                {selectedBuyingType?.name}) a {items.length} campanhas ETL.
                Confirme se isso é intencional.
              </Alert>
            )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={onConfirm} disabled={!canConfirm}>
          Confirmar associação
        </Button>
      </DialogActions>
    </Dialog>
  );
}
