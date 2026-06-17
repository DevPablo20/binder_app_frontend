import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import DomainAddIcon from '@mui/icons-material/DomainAdd';
import DomainDisabledIcon from '@mui/icons-material/DomainDisabled';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { getCompanies } from '@/api/company';
import { ApiError } from '@/api/client';
import { revokeMembership, syncUserCompanies } from '@/api/membership';
import { useAuth } from '@/auth/useAuth';
import { ROLE_LABELS } from '@/auth/roles';
import type { CompanyWithMembership } from '@/types/user';
import type { UserWithCompanies } from '@/types/user';

interface UserCompaniesDrawerProps {
  user: UserWithCompanies | null;
  open: boolean;
  onClose: () => void;
}

type ConfirmMode = 'grant' | 'revoke' | null;
type DrawerMode = 'view' | 'revoke';

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Erro ao processar solicitação. Tente novamente.';
}

export function UserCompaniesDrawer({
  user,
  open,
  onClose,
}: UserCompaniesDrawerProps) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('view');
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantSelection, setGrantSelection] = useState<string[]>([]);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const isSelf = user?.id === currentUser?.id;

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
    enabled: open && grantOpen,
  });

  const grantableCompanies = useMemo(() => {
    if (!user) return [];
    const linkedIds = new Set(user.companies.map((c) => c.id));
    return allCompanies.filter(
      (company) => company.isActive && !linkedIds.has(company.id),
    );
  }, [allCompanies, user]);

  const grantCompanyNameById = useMemo(
    () => new Map(grantableCompanies.map((c) => [c.id, c.name])),
    [grantableCompanies],
  );

  const selectedCompanies = useMemo(() => {
    if (!user) return [];
    const byId = new Map(user.companies.map((c) => [c.id, c]));
    return selectedCompanyIds
      .map((id) => byId.get(id))
      .filter((c): c is CompanyWithMembership => Boolean(c));
  }, [user, selectedCompanyIds]);

  const revokeMutation = useMutation({
    mutationFn: async (membershipIds: string[]) => {
      await Promise.all(membershipIds.map((id) => revokeMembership(id)));
    },
    onSuccess: async () => {
      await invalidateMembershipQueries(queryClient);
      resetFlow();
    },
    onError: (err) => setApiError(getErrorMessage(err)),
  });

  const grantMutation = useMutation({
    mutationFn: async ({
      userId,
      companyIds,
    }: {
      userId: string;
      companyIds: string[];
    }) => syncUserCompanies(userId, companyIds),
    onSuccess: async () => {
      await invalidateMembershipQueries(queryClient);
      resetFlow();
    },
    onError: (err) => setApiError(getErrorMessage(err)),
  });

  const isPending = revokeMutation.isPending || grantMutation.isPending;

  useEffect(() => {
    if (!open) {
      resetFlow();
    }
  }, [open]);

  function resetFlow() {
    setSelectedCompanyIds([]);
    setDrawerMode('view');
    setGrantOpen(false);
    setGrantSelection([]);
    setConfirmMode(null);
    setApiError(null);
    revokeMutation.reset();
    grantMutation.reset();
  }

  function handleClose() {
    if (isPending) return;
    resetFlow();
    onClose();
  }

  function toggleCompanySelection(companyId: string) {
    setSelectedCompanyIds((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId],
    );
  }

  function handleEnterRevokeMode() {
    setSelectedCompanyIds([]);
    setDrawerMode('revoke');
  }

  function handleCancelRevokeMode() {
    setSelectedCompanyIds([]);
    setDrawerMode('view');
  }

  function handleOpenGrant() {
    setApiError(null);
    setGrantSelection([]);
    setGrantOpen(true);
  }

  function handleCloseGrant() {
    if (isPending) return;
    setGrantOpen(false);
    setGrantSelection([]);
    setApiError(null);
  }

  function handleGrantContinue() {
    if (grantSelection.length === 0) return;
    setApiError(null);
    setGrantOpen(false);
    setConfirmMode('grant');
  }

  function handleOpenRevokeConfirm() {
    if (selectedCompanies.length === 0) return;
    setApiError(null);
    setConfirmMode('revoke');
  }

  function handleCancelConfirm() {
    if (isPending) return;
    setConfirmMode(null);
    setApiError(null);
    revokeMutation.reset();
    grantMutation.reset();
    if (confirmMode === 'grant') {
      setGrantOpen(true);
    }
  }

  function handleConfirm() {
    if (!user) return;
    setApiError(null);

    if (confirmMode === 'revoke') {
      revokeMutation.mutate(
        selectedCompanies.map((company) => company.membershipId),
      );
      return;
    }

    if (confirmMode === 'grant') {
      const currentIds = user.companies.map((c) => c.id);
      grantMutation.mutate({
        userId: user.id,
        companyIds: [...currentIds, ...grantSelection],
      });
    }
  }

  const grantSelectedNames = grantSelection
    .map((id) => grantCompanyNameById.get(id))
    .filter((name): name is string => Boolean(name));

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: { width: { xs: '100%', sm: 380 } },
          },
        }}
      >
        {user && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                p: 2.5,
                pb: 2,
              }}
            >
              <Box sx={{ pr: 1, minWidth: 0 }}>
                <Typography variant="h6" component="h2" noWrap>
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {user.email}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    mt: 1,
                  }}
                >
                  <Chip
                    label={user.isActive ? 'Ativo' : 'Inativo'}
                    size="small"
                    color={user.isActive ? 'success' : 'warning'}
                  />
                  <Chip
                    label={ROLE_LABELS[user.role]}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<GroupIcon />}
                    label={`${user.companies.length} empresa${
                      user.companies.length === 1 ? '' : 's'
                    }`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>

              <IconButton
                onClick={handleClose}
                aria-label="Fechar painel"
                edge="end"
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider />

            <Box
              sx={{
                px: 2.5,
                py: 2,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Empresas vinculadas
                </Typography>
                {drawerMode === 'revoke' && (
                  <Typography variant="caption" color="text.secondary">
                    Selecionando para revogação
                  </Typography>
                )}
              </Box>
              {drawerMode === 'view' && !isSelf && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<DomainAddIcon />}
                    onClick={handleOpenGrant}
                    disabled={isPending}
                  >
                    Conceder acesso
                  </Button>
                  {user.companies.length > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<DomainDisabledIcon />}
                      onClick={handleEnterRevokeMode}
                      disabled={isPending}
                    >
                      Revogar
                    </Button>
                  )}
                </Stack>
              )}
            </Box>

            {drawerMode === 'revoke' && (
              <Box sx={{ px: 2.5, pb: 2 }}>
                <Alert severity="warning">
                  Selecione as empresas para revogar o acesso.
                </Alert>
              </Box>
            )}

            {user.companies.length === 0 ? (
              <Box sx={{ px: 2.5, py: 4, textAlign: 'center', flexGrow: 1 }}>
                <GroupIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Nenhuma empresa vinculada a este usuário.
                </Typography>
                {drawerMode === 'view' && !isSelf && (
                  <Button
                    variant="contained"
                    startIcon={<DomainAddIcon />}
                    onClick={handleOpenGrant}
                    disabled={isPending}
                  >
                    Conceder acesso
                  </Button>
                )}
              </Box>
            ) : (
              <List disablePadding sx={{ flexGrow: 1, overflow: 'auto' }}>
                {user.companies.map((company, index) => {
                  const companyContent = (
                    <>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {company.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={company.name}
                        secondary={
                          <Box
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 0.5,
                              mt: 0.5,
                            }}
                          >
                            <Chip
                              label={company.isActive ? 'Ativa' : 'Inativa'}
                              size="small"
                              color={company.isActive ? 'success' : 'default'}
                            />
                          </Box>
                        }
                      />
                    </>
                  );

                  return (
                    <Box key={company.id}>
                      {index > 0 && <Divider component="li" />}
                      {drawerMode === 'view' ? (
                        <ListItem
                          alignItems="flex-start"
                          sx={{ px: 2.5, py: 1.5 }}
                        >
                          {companyContent}
                        </ListItem>
                      ) : (
                        <ListItem disablePadding>
                          <ListItemButton
                            onClick={() => toggleCompanySelection(company.id)}
                            disabled={isSelf || isPending}
                            sx={{ px: 2.5, py: 1.5, alignItems: 'flex-start' }}
                          >
                            <ListItemIcon sx={{ minWidth: 42, mt: 0.5 }}>
                              <Checkbox
                                edge="start"
                                checked={selectedCompanyIds.includes(company.id)}
                                tabIndex={-1}
                                disableRipple
                                disabled={isSelf || isPending}
                              />
                            </ListItemIcon>
                            {companyContent}
                          </ListItemButton>
                        </ListItem>
                      )}
                    </Box>
                  );
                })}
              </List>
            )}

            {drawerMode === 'revoke' && !isSelf && (
              <>
                <Divider />
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ p: 2, justifyContent: 'flex-end' }}
                >
                  <Button
                    onClick={handleCancelRevokeMode}
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleOpenRevokeConfirm}
                    disabled={isPending || selectedCompanyIds.length === 0}
                  >
                    Revogar selecionados
                  </Button>
                </Stack>
              </>
            )}
          </Box>
        )}
      </Drawer>

      <Dialog
        open={grantOpen}
        onClose={handleCloseGrant}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Conceder acesso a empresas</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Selecione as empresas para vincular a{' '}
              <strong>{user?.name}</strong>:
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="grant-companies-label">Empresas</InputLabel>
              <Select
                multiple
                labelId="grant-companies-label"
                label="Empresas"
                value={grantSelection}
                onChange={(event) => {
                  const value = event.target.value;
                  setGrantSelection(
                    typeof value === 'string' ? value.split(',') : value,
                  );
                }}
                renderValue={(selected) =>
                  selected
                    .map((id) => grantCompanyNameById.get(id))
                    .filter(Boolean)
                    .join(', ')
                }
              >
                {grantableCompanies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    <Checkbox checked={grantSelection.includes(company.id)} />
                    <ListItemText primary={company.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {grantableCompanies.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Não há empresas disponíveis para conceder acesso.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGrant} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGrantContinue}
            disabled={isPending || grantSelection.length === 0}
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmMode !== null}
        onClose={handleCancelConfirm}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {confirmMode === 'grant'
            ? 'Confirmar concessão de acesso'
            : 'Confirmar revogação de acesso'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {apiError && <Alert severity="error">{apiError}</Alert>}
            {confirmMode === 'revoke' ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  Revogar o acesso de <strong>{user?.name}</strong> a{' '}
                  {selectedCompanies.length} empresa
                  {selectedCompanies.length === 1 ? '' : 's'}?
                </Typography>
                <Box>
                  {selectedCompanies.map((company) => (
                    <Typography key={company.id} variant="body1">
                      {company.name}
                    </Typography>
                  ))}
                </Box>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  Conceder acesso de <strong>{user?.name}</strong> às empresas:
                </Typography>
                <Box>
                  {grantSelectedNames.map((name) => (
                    <Typography key={name} variant="body1">
                      {name}
                    </Typography>
                  ))}
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelConfirm} disabled={isPending}>
            Voltar
          </Button>
          <Button
            variant="contained"
            color={confirmMode === 'revoke' ? 'error' : 'primary'}
            onClick={handleConfirm}
            disabled={isPending}
            startIcon={
              isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : undefined
            }
          >
            {confirmMode === 'revoke' ? 'Revogar acesso' : 'Conceder acesso'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

async function invalidateMembershipQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['companies'] }),
    queryClient.invalidateQueries({ queryKey: ['users'] }),
  ]);
}
