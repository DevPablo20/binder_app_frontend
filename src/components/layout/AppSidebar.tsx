import MenuIcon from '@mui/icons-material/Menu';
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';

import { useAuth } from '@/auth/useAuth';
import { BinderLogo } from '@/components/BinderLogo';
import { SidebarAccountStrip } from '@/components/layout/SidebarAccountStrip';
import { SidebarNavGroup } from '@/components/layout/SidebarNavGroup';
import { UserOptionsDialog } from '@/components/layout/UserOptionsDialog';
import {
  NAV_SECTION_LABELS,
  NAV_SECTION_ORDER,
  getVisibleNavItems,
  groupNavItemsBySection,
} from '@/navigation/navConfig';

const DRAWER_WIDTH_EXPANDED = 240;
const DRAWER_WIDTH_COLLAPSED = 72;

function SidebarContent({
  expanded,
  onMenuClick,
  onUserClick,
  onNavClick,
}: {
  expanded: boolean;
  onMenuClick: () => void;
  onUserClick: () => void;
  onNavClick?: () => void;
}) {
  const { user } = useAuth();
  const navGroups = groupNavItemsBySection(getVisibleNavItems(user?.role));
  const visibleSections = NAV_SECTION_ORDER.filter(
    (section) => (navGroups[section]?.length ?? 0) > 0,
  );

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

      <Box
        sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}
      >
        {visibleSections.map((section, index) => (
          <Box key={section}>
            {index > 0 && <Divider sx={{ mx: 1, my: 0.5 }} />}
            <SidebarNavGroup
              title={NAV_SECTION_LABELS[section]}
              items={navGroups[section] ?? []}
              expanded={expanded}
              onItemClick={onNavClick}
            />
          </Box>
        ))}
      </Box>

      <SidebarAccountStrip expanded={expanded} onClick={onUserClick} />
    </Box>
  );
}

export function AppSidebar() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  const open = pinned || hovered;

  const handleToggle = () => {
    setPinned((prev) => !prev);
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
  };

  // Reserve collapsed width unless pinned so hover expand overlays content.
  const layoutWidth = pinned ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED;
  const paperWidth = open ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED;

  const drawerPaperSx = {
    width: paperWidth,
    boxSizing: 'border-box',
    overflowX: 'hidden',
    zIndex: hovered && !pinned ? theme.zIndex.drawer + 1 : undefined,
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
          slotProps={{
            paper: {
              onMouseEnter: () => setHovered(true),
              onMouseLeave: () => setHovered(false),
            },
          }}
          sx={{
            width: layoutWidth,
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
          onMenuClick={() => setMobileOpen(true)}
          onUserClick={() => setUserDialogOpen(true)}
        />
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleMobileClose}
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
          onMenuClick={handleMobileClose}
          onNavClick={handleMobileClose}
          onUserClick={() => {
            handleMobileClose();
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
