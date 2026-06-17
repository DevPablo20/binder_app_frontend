import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
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
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { ApiError } from '@/api/client';
import { revokeMembership, syncUserCompanies } from '@/api/membership';
import { getUsers } from '@/api/user';
import { useAuth } from '@/auth/useAuth';
import { ROLE_LABELS } from '@/auth/roles';
import type { CompanyWithUsers, UserWithMembership } from '@/types/company';

interface CompanyUsersDrawerProps {
  company: CompanyWithUsers | null;
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

export function CompanyUsersDrawer({
  company,
  open,
  onClose,
}: CompanyUsersDrawerProps) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('view');
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantSelection, setGrantSelection] = useState<string[]>([]);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: open,
  });

  const grantableUsers = useMemo(() => {
    if (!company || !currentUser) return [];
    const linkedIds = new Set(company.users.map((u) => u.id));
    return allUsers.filter(
      (user) =>
        user.isActive &&
        user.id !== currentUser.id &&
        !linkedIds.has(user.id),
    );
  }, [allUsers, company, currentUser]);

  const grantUserNameById = useMemo(
    () => new Map(grantableUsers.map((u) => [u.id, u.name])),
    [grantableUsers],
  );

  const usersById = useMemo(
    () => new Map(allUsers.map((u) => [u.id, u])),
    [allUsers],
  );

  const selectedUsers = useMemo(() => {
    if (!company) return [];
    const byId = new Map(company.users.map((u) => [u.id, u]));
    return selectedUserIds
      .map((id) => byId.get(id))
      .filter((u): u is UserWithMembership => Boolean(u));
  }, [company, selectedUserIds]);

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
      companyId,
      userIds,
    }: {
      companyId: string;
      userIds: string[];
    }) => {
      await Promise.all(
        userIds.map((userId) => {
          const user = usersById.get(userId);
          if (!user) {
            throw new Error('Usuário não encontrado');
          }
          const companyIds = [...user.companies.map((c) => c.id), companyId];
          return syncUserCompanies(userId, companyIds);
        }),
      );
    },
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
    setSelectedUserIds([]);
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

  function toggleUserSelection(userId: string) {
    if (userId === currentUser?.id) return;
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }

  function handleEnterRevokeMode() {
    setSelectedUserIds([]);
    setDrawerMode('revoke');
  }

  function handleCancelRevokeMode() {
    setSelectedUserIds([]);
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
    if (selectedUsers.length === 0) return;
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
    if (!company) return;
    setApiError(null);

    if (confirmMode === 'revoke') {
      revokeMutation.mutate(
        selectedUsers.map((linkedUser) => linkedUser.membershipId),
      );
      return;
    }

    if (confirmMode === 'grant') {
      grantMutation.mutate({
        companyId: company.id,
        userIds: grantSelection,
      });
    }
  }

  const grantSelectedNames = grantSelection
    .map((id) => grantUserNameById.get(id))
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
        {company && (
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
                  {company.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {company.description}
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
                    label={company.isActive ? 'Ativa' : 'Inativa'}
                    size="small"
                    color={company.isActive ? 'success' : 'default'}
                  />
                  <Chip
                    icon={<GroupIcon />}
                    label={`${company.users.length} usuário${company.users.length === 1 ? '' : 's'}`}
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
                  Usuários vinculados
                </Typography>
                {drawerMode === 'revoke' && (
                  <Typography variant="caption" color="text.secondary">
                    Selecionando para revogação
                  </Typography>
                )}
              </Box>
              {drawerMode === 'view' && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PersonAddIcon />}
                    onClick={handleOpenGrant}
                    disabled={isPending}
                  >
                    Conceder acesso
                  </Button>
                  {company.users.length > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<PersonRemoveIcon />}
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
                  Selecione os usuários para revogar o acesso.
                </Alert>
              </Box>
            )}

            {company.users.length === 0 ? (
              <Box sx={{ px: 2.5, py: 4, textAlign: 'center', flexGrow: 1 }}>
                <GroupIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Nenhum usuário vinculado a esta empresa.
                </Typography>
                {drawerMode === 'view' && (
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={handleOpenGrant}
                    disabled={isPending}
                  >
                    Conceder acesso
                  </Button>
                )}
              </Box>
            ) : (
              <List disablePadding sx={{ flexGrow: 1, overflow: 'auto' }}>
                {company.users.map((linkedUser, index) => {
                  const isCurrentUser = linkedUser.id === currentUser?.id;
                  const userContent = (
                    <>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {linkedUser.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={linkedUser.name}
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.5 }}
                            >
                              {linkedUser.email}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.5,
                                mt: 0.5,
                              }}
                            >
                              <Chip
                                label={ROLE_LABELS[linkedUser.role]}
                                size="small"
                                variant="outlined"
                              />
                              {!linkedUser.isActive && (
                                <Chip
                                  label="Inativo"
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </>
                        }
                      />
                    </>
                  );

                  return (
                    <Box key={linkedUser.id}>
                      {index > 0 && <Divider component="li" />}
                      {drawerMode === 'view' ? (
                        <ListItem
                          alignItems="flex-start"
                          sx={{ px: 2.5, py: 1.5 }}
                        >
                          {userContent}
                        </ListItem>
                      ) : (
                        <ListItem disablePadding>
                          <ListItemButton
                            onClick={() => toggleUserSelection(linkedUser.id)}
                            disabled={isCurrentUser || isPending}
                            sx={{ px: 2.5, py: 1.5, alignItems: 'flex-start' }}
                          >
                            <ListItemIcon sx={{ minWidth: 42, mt: 0.5 }}>
                              <Checkbox
                                edge="start"
                                checked={selectedUserIds.includes(linkedUser.id)}
                                tabIndex={-1}
                                disableRipple
                                disabled={isCurrentUser || isPending}
                              />
                            </ListItemIcon>
                            {userContent}
                          </ListItemButton>
                        </ListItem>
                      )}
                    </Box>
                  );
                })}
              </List>
            )}

            {drawerMode === 'revoke' && (
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
                    disabled={isPending || selectedUserIds.length === 0}
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
        <DialogTitle>Conceder acesso a usuários</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Selecione os usuários para vincular à empresa{' '}
              <strong>{company?.name}</strong>:
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="grant-users-label">Usuários</InputLabel>
              <Select
                multiple
                labelId="grant-users-label"
                label="Usuários"
                value={grantSelection}
                onChange={(event) => {
                  const value = event.target.value;
                  setGrantSelection(
                    typeof value === 'string' ? value.split(',') : value,
                  );
                }}
                renderValue={(selected) =>
                  selected
                    .map((id) => grantUserNameById.get(id))
                    .filter(Boolean)
                    .join(', ')
                }
              >
                {grantableUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    <Checkbox checked={grantSelection.includes(user.id)} />
                    <ListItemText
                      primary={user.name}
                      secondary={user.email}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {grantableUsers.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Não há usuários disponíveis para conceder acesso.
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
                  Revogar o acesso de {selectedUsers.length} usuário
                  {selectedUsers.length === 1 ? '' : 's'} à empresa{' '}
                  <strong>{company?.name}</strong>?
                </Typography>
                <Box>
                  {selectedUsers.map((linkedUser) => (
                    <Typography key={linkedUser.id} variant="body1">
                      {linkedUser.name}
                    </Typography>
                  ))}
                </Box>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  Conceder acesso à empresa <strong>{company?.name}</strong>{' '}
                  para:
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
