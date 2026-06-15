import type { ThemeMode } from '@/theme/palette';

declare module '@mui/material/styles' {
  interface TypeBackground {
    elevated: string;
    gradient: string;
  }
}

export type { ThemeMode };
