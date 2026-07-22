import { Tab, Tabs } from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';

const BRIDGE_TABS = [
  { label: 'Contas', path: '/dashboard/bridge/accounts' },
  { label: 'Campanhas', path: '/dashboard/bridge/campaigns' },
  { label: 'Ad groups', path: '/dashboard/bridge/ad-groups' },
  { label: 'Anúncios', path: '/dashboard/bridge/ads' },
] as const;

export function BridgeTabs() {
  const location = useLocation();
  const activeIndex = BRIDGE_TABS.findIndex(
    (tab) => location.pathname === tab.path,
  );

  return (
    <Tabs
      value={activeIndex === -1 ? 0 : activeIndex}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      {BRIDGE_TABS.map((tab) => (
        <Tab
          key={tab.path}
          label={tab.label}
          component={NavLink}
          to={tab.path}
        />
      ))}
    </Tabs>
  );
}
