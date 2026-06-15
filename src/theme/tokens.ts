export const orange = {
  main: '#F36B20',
  light: '#FFA00A',
  dark: '#F85200',
} as const;

export const teal = {
  main: '#27A59E',
  light: '#23CFC5',
} as const;

export const green = {
  main: '#61BE6B',
  light: '#54D462',
} as const;

export const neutral = {
  black: '#101010',
  charcoal: '#21201F',
  darkWarm: '#1C1A19',
  gray: '#EDEDED',
  white: '#FFFFFF',
} as const;

/** Login/hero layouts only — not for global body or data screens. */
export const heroGradient = [
  'radial-gradient(ellipse at 85% 15%, rgba(35, 207, 197, 0.15), transparent 50%)',
  'radial-gradient(ellipse at 70% 0%, rgba(243, 107, 32, 0.12), transparent 45%)',
  neutral.black,
].join(', ');
