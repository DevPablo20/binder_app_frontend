import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import {
  Avatar,
  Box,
  IconButton,
  ListItemButton,
  Tooltip,
  Typography,
} from '@mui/material';

import { ROLE_LABELS } from '@/auth/roles';
import { useAuth } from '@/auth/useAuth';

interface SidebarAccountStripProps {
  expanded: boolean;
  onClick: () => void;
}

export function SidebarAccountStrip({
  expanded,
  onClick,
}: SidebarAccountStripProps) {
  const { user } = useAuth();

  if (!expanded) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          p: 1,
          pb: 2,
        }}
      >
        <Tooltip title="Conta e preferências">
          <IconButton
            onClick={onClick}
            aria-label="Conta e preferências"
            color="inherit"
            size="large"
          >
            <AccountCircleIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  const roleLabel = user ? ROLE_LABELS[user.role] : '';
  const tooltipTitle = [user?.name, roleLabel, user?.email]
    .filter(Boolean)
    .join(' · ');

  return (
    <Box
      sx={{
        p: 1,
        pb: 2,
        width: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <Tooltip title={tooltipTitle}>
        <ListItemButton
          onClick={onClick}
          aria-label="Conta e preferências"
          sx={{
            borderRadius: 1,
            px: 1,
            py: 1,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <Avatar sx={{ width: 36, height: 36, mr: 1.5, flexShrink: 0 }}>
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, display: 'block' }}
              noWrap
            >
              {user?.name ?? 'Usuário'}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block' }}
              noWrap
            >
              {roleLabel}
            </Typography>
            {user?.email && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block' }}
                noWrap
              >
                {user.email}
              </Typography>
            )}
          </Box>
        </ListItemButton>
      </Tooltip>
    </Box>
  );
}
