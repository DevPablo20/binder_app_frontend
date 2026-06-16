import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Tooltip,
} from '@mui/material';
import { NavLink } from 'react-router-dom';

import type { NavItem } from '@/navigation/navConfig';

interface SidebarNavGroupProps {
  title: string;
  items: NavItem[];
  expanded: boolean;
  onItemClick?: () => void;
}

function NavItemButton({
  item,
  expanded,
  onItemClick,
}: {
  item: NavItem;
  expanded: boolean;
  onItemClick?: () => void;
}) {
  return (
    <ListItemButton
      component={NavLink}
      to={item.path}
      end={item.end}
      onClick={onItemClick}
      sx={{
        borderRadius: 1,
        mx: expanded ? 1 : 0.5,
        justifyContent: expanded ? 'flex-start' : 'center',
        '&.active': {
          bgcolor: 'action.selected',
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: expanded ? 40 : 0,
          justifyContent: 'center',
        }}
      >
        <item.icon />
      </ListItemIcon>
      {expanded && (
        <ListItemText
          primary={item.label}
          slotProps={{ primary: { noWrap: true } }}
        />
      )}
    </ListItemButton>
  );
}

export function SidebarNavGroup({
  title,
  items,
  expanded,
  onItemClick,
}: SidebarNavGroupProps) {
  if (items.length === 0) {
    return null;
  }

  if (!expanded) {
    return (
      <Box sx={{ px: 0.5, py: 0.5 }}>
        {items.map((item) => (
          <Tooltip key={item.id} title={item.label}>
            <Box>
              <NavItemButton
                item={item}
                expanded={expanded}
                onItemClick={onItemClick}
              />
            </Box>
          </Tooltip>
        ))}
      </Box>
    );
  }

  return (
    <List
      subheader={
        <ListSubheader
          component="div"
          sx={{
            bgcolor: 'transparent',
            lineHeight: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            px: 2,
          }}
        >
          {title}
        </ListSubheader>
      }
      sx={{ px: 0, py: 0.5 }}
    >
      {items.map((item) => (
        <NavItemButton
          key={item.id}
          item={item}
          expanded={expanded}
          onItemClick={onItemClick}
        />
      ))}
    </List>
  );
}
