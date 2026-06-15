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

import type { CompanyWithUsers } from '@/types/company';
import type { Role } from '@/types/user';

const ROLE_LABELS: Record<Role, string> = {
  superadmin: 'Superadmin',
  editor: 'Editor',
  viewer: 'Visualizador',
};

interface CompanyUsersDrawerProps {
  company: CompanyWithUsers | null;
  open: boolean;
  onClose: () => void;
}

export function CompanyUsersDrawer({
  company,
  open,
  onClose,
}: CompanyUsersDrawerProps) {
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
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
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
            <IconButton onClick={onClose} aria-label="Fechar painel" edge="end">
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider />

          <Box sx={{ px: 2.5, py: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Usuários vinculados
            </Typography>
          </Box>

          {company.users.length === 0 ? (
            <Box sx={{ px: 2.5, py: 4, textAlign: 'center' }}>
              <GroupIcon
                sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Nenhum usuário vinculado a esta empresa.
              </Typography>
            </Box>
          ) : (
            <List disablePadding sx={{ flexGrow: 1, overflow: 'auto' }}>
              {company.users.map((user, index) => (
                <Box key={user.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem alignItems="flex-start" sx={{ px: 2.5, py: 1.5 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.name}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            {user.email}
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
                              label={ROLE_LABELS[user.role]}
                              size="small"
                              variant="outlined"
                            />
                            {!user.isActive && (
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
