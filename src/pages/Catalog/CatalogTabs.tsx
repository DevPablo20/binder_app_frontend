import { Tab, Tabs } from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';

const CATALOG_TABS = [
  { label: 'Plataformas', path: '/dashboard/catalog/platforms' },
  { label: 'Canais', path: '/dashboard/catalog/channels' },
  { label: 'Tipos de compra', path: '/dashboard/catalog/buying-types' },
] as const;

export function CatalogTabs() {
  const location = useLocation();
  const activeIndex = CATALOG_TABS.findIndex(
    (tab) => location.pathname === tab.path,
  );

  return (
    <Tabs
      value={activeIndex === -1 ? 0 : activeIndex}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      {CATALOG_TABS.map((tab) => (
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
