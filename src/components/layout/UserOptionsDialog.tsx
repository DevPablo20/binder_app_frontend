import LockResetIcon from '@mui/icons-material/LockReset';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { forgotPassword, logout } from '@/api/auth';
import { ApiError } from '@/api/client';
import { ROLE_LABELS } from '@/auth/roles';
import { useAuth } from '@/auth/useAuth';
import { ThemeModeToggle } from '@/theme/ThemeModeToggle';

interface UserOptionsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function UserOptionsDialog({ open, onClose }: UserOptionsDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const [passwordResetMessage, setPasswordResetMessage] = useState<
    string | null
  >(null);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      onClose();
      navigate('/', { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError('Erro ao sair. Tente novamente.');
      }
    },
  });

  const passwordResetMutation = useMutation({
    mutationFn: (email: string) => forgotPassword({ email }),
    onSuccess: (data) => {
      setApiError(null);
      setPasswordResetMessage(data.message);
    },
    onError: (error) => {
      setPasswordResetMessage(null);
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError('Erro ao solicitar redefinição de senha. Tente novamente.');
      }
    },
  });

  const handleClose = () => {
    if (logoutMutation.isPending || passwordResetMutation.isPending) return;
    setApiError(null);
    setPasswordResetMessage(null);
    onClose();
  };

  const handleLogout = () => {
    setApiError(null);
    setPasswordResetMessage(null);
    logoutMutation.mutate();
  };

  const handlePasswordReset = () => {
    if (!user?.email) return;
    setApiError(null);
    setPasswordResetMessage(null);
    passwordResetMutation.mutate(user.email);
  };

  const isPending = logoutMutation.isPending || passwordResetMutation.isPending;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="user-options-dialog-title"
    >
      <DialogTitle id="user-options-dialog-title">
        <Stack spacing={1}>
          <Stack spacing={0.5}>
            <Typography variant="h6" component="span">
              {user?.name ?? 'Usuário'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Stack>
          {user && (
            <Chip
              label={ROLE_LABELS[user.role]}
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            />
          )}
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {apiError && <Alert severity="error">{apiError}</Alert>}
          {passwordResetMessage && (
            <Alert severity="success">{passwordResetMessage}</Alert>
          )}

          {user && user.companies.length > 0 && (
            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Empresas vinculadas</Typography>
              <List dense disablePadding>
                {user.companies.map((company) => (
                  <ListItem key={company.id} disableGutters sx={{ py: 0.25 }}>
                    <ListItemText
                      primary={company.name}
                      secondary={company.isActive ? undefined : 'Inativa'}
                    />
                  </ListItem>
                ))}
              </List>
            </Stack>
          )}

          <List disablePadding>
            <ListItem secondaryAction={<ThemeModeToggle />} sx={{ px: 0 }}>
              <ListItemText primary="Tema" secondary="Claro / escuro" />
            </ListItem>
          </List>

          <Button
            variant="outlined"
            color="primary"
            fullWidth
            startIcon={
              passwordResetMutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <LockResetIcon />
              )
            }
            onClick={handlePasswordReset}
            disabled={isPending || !user?.email}
          >
            Alterar senha
          </Button>

          <Button
            variant="outlined"
            color="primary"
            fullWidth
            startIcon={
              logoutMutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <LogoutIcon />
              )
            }
            onClick={handleLogout}
            disabled={isPending}
          >
            Sair
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
