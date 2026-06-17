import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import {
  Avatar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';

import { ROLE_LABELS } from '@/auth/roles';
import type { UserWithCompanies } from '@/types/user';

interface UserCompaniesDrawerProps {
  user: UserWithCompanies | null;
  open: boolean;
  onClose: () => void;
}

export function UserCompaniesDrawer({
  user,
  open,
  onClose,
}: UserCompaniesDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
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

            <IconButton onClick={onClose} aria-label="Fechar painel" edge="end">
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider />

          <Box sx={{ px: 2.5, py: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Empresas vinculadas
            </Typography>
          </Box>

          {user.companies.length === 0 ? (
            <Box sx={{ px: 2.5, py: 4, textAlign: 'center' }}>
              <GroupIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Nenhuma empresa vinculada a este usuário.
              </Typography>
            </Box>
          ) : (
            <List disablePadding sx={{ flexGrow: 1, overflow: 'auto' }}>
              {user.companies.map((company, index) => (
                <Box key={company.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem alignItems="flex-start" sx={{ px: 2.5, py: 1.5 }}>
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
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </Box>
      )}
    </Drawer>
  );
}

