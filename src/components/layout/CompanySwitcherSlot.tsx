import { Box } from '@mui/material';

/**
 * Reserved slot for future company switcher UI.
 * Insert CompanySwitcher here without reshuffling sidebar nav items.
 */
export function CompanySwitcherSlot() {
  return (
    <Box
      sx={{ px: 1, minHeight: 0 }}
      aria-hidden
      data-testid="company-switcher-slot"
    />
  );
}
