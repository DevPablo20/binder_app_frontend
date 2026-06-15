import '@/theme/types';

import { createTheme, type Theme } from '@mui/material/styles';

import { components } from '@/theme/components';
import { getPalette, type ThemeMode } from '@/theme/palette';
import { typography } from '@/theme/typography';

export function getTheme(mode: ThemeMode): Theme {
  return createTheme({
    palette: getPalette(mode),
    typography,
    components,
  });
}

export const darkTheme = getTheme('dark');
export const lightTheme = getTheme('light');

export type { ThemeMode };
