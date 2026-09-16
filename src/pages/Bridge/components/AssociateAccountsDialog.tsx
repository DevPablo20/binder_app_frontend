import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';

import type { ClientSummary } from '@/types/client';

export interface AssociateAccountPreview {
  externalAccountId: string;
  accountName: string;
}

interface AssociateAccountsDialogProps {
  open: boolean;
  accounts: AssociateAccountPreview[];
  clients: ClientSummary[];
  selectedClientId: string;
  onSelectedClientIdChange: (clientId: string) => void;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AssociateAccountsDialog({
  open,
  accounts,
  clients,
  selectedClientId,
  onSelectedClientIdChange,
  loading = false,
  onCancel,
  onConfirm,
}: AssociateAccountsDialogProps) {
  const activeClients = clients.filter((client) => client.isActive);
  const selectedClient = activeClients.find(
    (client) => client.id === selectedClientId,
  );
  const canConfirm = accounts.length > 0 && Boolean(selectedClient) && !loading;

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
            Selecione o cliente dono das {accounts.length} conta(s) ETL
            selecionada(s). Cada conta pertence a exatamente um cliente.
          </Typography>

          <RadioGroup
            value={selectedClientId}
            onChange={(event) => onSelectedClientIdChange(event.target.value)}
          >
            {activeClients.map((client) => (
              <FormControlLabel
                key={client.id}
                value={client.id}
                control={<Radio disabled={loading} />}
                label={client.name}
              />
            ))}
          </RadioGroup>

          {activeClients.length === 0 && (
            <Alert severity="warning">Nenhum cliente ativo disponível.</Alert>
          )}

          {selectedClient && (
            <Stack spacing={1}>
              <Typography variant="subtitle2">
                Confira as associações
              </Typography>
              {accounts.map((account) => (
                <Typography key={account.externalAccountId} variant="body2">
                  {account.accountName} ({account.externalAccountId}) →{' '}
                  {selectedClient.name}
                </Typography>
              ))}
            </Stack>
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
