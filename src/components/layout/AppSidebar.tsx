import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import {
  Box,
  Drawer,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';

import { BinderLogo } from '@/components/BinderLogo';
import { UserOptionsDialog } from '@/components/layout/UserOptionsDialog';

const DRAWER_WIDTH_EXPANDED = 240;
const DRAWER_WIDTH_COLLAPSED = 72;

function SidebarContent({
  expanded,
  onMenuClick,
  onUserClick,
}: {
  expanded: boolean;
  onMenuClick: () => void;
  onUserClick: () => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          minHeight: 64,
        }}
      >
        <Tooltip title={expanded ? 'Recolher menu' : 'Expandir menu'}>
          <IconButton
            onClick={onMenuClick}
            aria-label={expanded ? 'Recolher menu' : 'Expandir menu'}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>
        {expanded && (
          <BinderLogo
            sx={{
              width: 120,
              height: 'auto',
              flexShrink: 0,
            }}
          />
        )}
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      <Box
        sx={{
          display: 'flex',
          justifyContent: expanded ? 'flex-start' : 'center',
          p: 1,
          pb: 2,
        }}
      >
        <Tooltip title="Opções do usuário">
          <IconButton
            onClick={onUserClick}
            aria-label="Opções do usuário"
            color="inherit"
            size="large"
          >
            <AccountCircleIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export function AppSidebar() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const drawerWidth = open ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED;

  const drawerPaperSx = {
    width: drawerWidth,
    boxSizing: 'border-box',
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  };

  if (isDesktop) {
    return (
      <>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': drawerPaperSx,
          }}
        >
          <SidebarContent
            expanded={open}
            onMenuClick={handleToggle}
            onUserClick={() => setUserDialogOpen(true)}
          />
        </Drawer>
        <UserOptionsDialog
          open={userDialogOpen}
          onClose={() => setUserDialogOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH_COLLAPSED,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH_COLLAPSED,
            boxSizing: 'border-box',
            overflowX: 'hidden',
          },
        }}
      >
        <SidebarContent
          expanded={false}
          onMenuClick={() => setOpen(true)}
          onUserClick={() => setUserDialogOpen(true)}
        />
      </Drawer>

      <Drawer
        variant="temporary"
        open={open}
        onClose={handleClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH_EXPANDED,
            boxSizing: 'border-box',
          },
        }}
      >
        <SidebarContent
          expanded
          onMenuClick={handleClose}
          onUserClick={() => {
            handleClose();
            setUserDialogOpen(true);
          }}
        />
      </Drawer>

      <UserOptionsDialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
      />
    </>
  );
}
