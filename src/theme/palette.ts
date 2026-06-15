import type { PaletteOptions } from '@mui/material/styles';

import { green, heroGradient, neutral, orange, teal } from '@/theme/tokens';

export type ThemeMode = 'light' | 'dark';

const brandColors = {
  primary: {
    main: orange.main,
    light: orange.light,
    dark: orange.dark,
    contrastText: neutral.white,
  },
  secondary: {
    main: teal.light,
    contrastText: neutral.black,
  },
  success: {
    main: green.light,
    contrastText: neutral.black,
  },
} satisfies Pick<PaletteOptions, 'primary' | 'secondary' | 'success'>;

export function getPalette(mode: ThemeMode): PaletteOptions {
  if (mode === 'dark') {
    return {
      mode: 'dark',
      ...brandColors,
      background: {
        default: neutral.black,
        paper: neutral.charcoal,
        elevated: neutral.darkWarm,
        gradient: heroGradient,
      },
      text: {
        primary: neutral.white,
        secondary: 'rgba(237, 237, 237, 0.7)',
      },
      divider: 'rgba(255, 255, 255, 0.12)',
    };
  }

  return {
    mode: 'light',
    ...brandColors,
    background: {
      default: neutral.white,
      paper: neutral.white,
      elevated: neutral.white,
      gradient: heroGradient,
    },
    text: {
      primary: neutral.charcoal,
      secondary: '#434343',
    },
    divider: neutral.gray,
  };
}
