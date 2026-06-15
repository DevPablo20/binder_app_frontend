import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { IconButton, Tooltip } from '@mui/material';

import { useThemeMode } from '@/theme/themeModeContext';

export function ThemeModeToggle() {
  const { mode, toggleMode } = useThemeMode();

  return (
    <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo escuro'}>
      <IconButton
        onClick={toggleMode}
        color="inherit"
        aria-label={
          mode === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'
        }
      >
        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
}
