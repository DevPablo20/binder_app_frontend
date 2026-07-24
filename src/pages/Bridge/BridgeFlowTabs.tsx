import { Tab, Tabs } from '@mui/material';

export type BridgeFlowTab = 'vinculados' | 'nova';

interface BridgeFlowTabsProps {
  value: BridgeFlowTab;
  onChange: (value: BridgeFlowTab) => void;
}

export function BridgeFlowTabs({ value, onChange }: BridgeFlowTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: BridgeFlowTab) => onChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Tab label="Vinculados" value="vinculados" />
      <Tab label="Nova vinculação" value="nova" />
    </Tabs>
  );
}
