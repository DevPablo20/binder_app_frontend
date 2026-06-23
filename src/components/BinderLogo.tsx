import type { BoxProps } from '@mui/material';
import { Box } from '@mui/material';

import logoBlack from '@/assets/brand/logo-black.png';
import logoWhite from '@/assets/brand/logo-white.png';
import { useThemeMode } from '@/theme/themeModeContext';

type BinderLogoProps = Omit<BoxProps<'img'>, 'component' | 'src' | 'alt'>;

export function BinderLogo(props: BinderLogoProps) {
  const { mode } = useThemeMode();
  const src = mode === 'dark' ? logoWhite : logoBlack;

  return <Box component="img" src={src} alt="binder REIMAGINE" {...props} />;
}
