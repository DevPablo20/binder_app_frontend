import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
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
  selectedClientIds: string[];
  onSelectedClientIdsChange: (clientIds: string[]) => void;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AssociateAccountsDialog({
  open,
  accounts,
  clients,
  selectedClientIds,
  onSelectedClientIdsChange,
  loading = false,
  onCancel,
  onConfirm,
}: AssociateAccountsDialogProps) {
  const activeClients = clients.filter((client) => client.isActive);
  const selectedClients = activeClients.filter((client) =>
    selectedClientIds.includes(client.id),
  );
  const isMultiClient = selectedClientIds.length > 1;
  const canConfirm =
    accounts.length > 0 && selectedClientIds.length > 0 && !loading;

  const toggleClient = (clientId: string) => {
    if (selectedClientIds.includes(clientId)) {
      onSelectedClientIdsChange(
        selectedClientIds.filter((id) => id !== clientId),
      );
      return;
    }
    onSelectedClientIdsChange([...selectedClientIds, clientId]);
  };

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
            Selecione um ou mais clientes para associar às {accounts.length}{' '}
            conta(s) ETL selecionada(s).
          </Typography>

          <FormGroup>
            {activeClients.map((client) => (
              <FormControlLabel
                key={client.id}
                control={
                  <Checkbox
                    checked={selectedClientIds.includes(client.id)}
                    onChange={() => toggleClient(client.id)}
                    disabled={loading}
                  />
                }
                label={client.name}
              />
            ))}
          </FormGroup>

          {activeClients.length === 0 && (
            <Alert severity="warning">Nenhum cliente ativo disponível.</Alert>
          )}

          {selectedClients.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="subtitle2">Confira as associações</Typography>
              {accounts.map((account) =>
                selectedClients.map((client) => (
                  <Typography
                    key={`${account.externalAccountId}:${client.id}`}
                    variant="body2"
                  >
                    {account.accountName} ({account.externalAccountId}) →{' '}
                    {client.name}
                  </Typography>
                )),
              )}
            </Stack>
          )}

          {isMultiClient && (
            <Alert severity="warning">
              Você selecionou mais de um cliente. Cada conta ETL será vinculada
              a todos os clientes escolhidos. Confirme se isso é intencional.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={!canConfirm}
        >
          Confirmar associação
        </Button>
      </DialogActions>
    </Dialog>
  );
}
