import LogoutIcon from '@mui/icons-material/Logout';
import {
  Alert,
  Button,
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

import { logout } from '@/api/auth';
import { ApiError } from '@/api/client';
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

  const mutation = useMutation({
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

  const handleClose = () => {
    if (mutation.isPending) return;
    setApiError(null);
    onClose();
  };

  const handleLogout = () => {
    setApiError(null);
    mutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="user-options-dialog-title"
    >
      <DialogTitle id="user-options-dialog-title">
        <Stack spacing={0.5}>
          <Typography variant="h6" component="span">
            {user?.name ?? 'Usuário'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {apiError && <Alert severity="error">{apiError}</Alert>}

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
              mutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <LogoutIcon />
              )
            }
            onClick={handleLogout}
            disabled={mutation.isPending}
          >
            Sair
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
